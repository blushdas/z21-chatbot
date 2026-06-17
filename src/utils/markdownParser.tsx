import React from 'react';
import { Copy, Check } from 'lucide-react';
import ViewSourceLink from '@/components/ViewSourceLink';
import { SourceData } from '@/hooks/useSourceDrawer';
import { extractCitations } from '@/utils/citationParser';
import CitationMarker from '@/components/citations/CitationMarker';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
 import { sanitizeLLMResponse, detectSuspiciousContent } from '@/utils/sanitize';

// ============= COPY BUTTON COMPONENT =============
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--chat-card-2)] hover:bg-[var(--ui-bg-hover)] 
                 text-[var(--chat-text)] border border-[var(--chat-border)] transition-colors"
      aria-label={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

// ============= UNIFIED TEXT PROCESSOR =============
// Single-pass normalization to avoid conflicts
const normalizeTextOnce = (text: string): string => {
  if (!text) return text;
  
  let normalized = text;
  
  // Step 0: Fix missing spaces after sentence-ending punctuation (. ? !)
  // This catches LLM output where sentences run together like "area?No" or "there.Space"
  // Add space after . ? ! when directly followed by a letter (no space between)
  normalized = normalized.replace(/([.?!])([A-Za-z])/g, '$1 $2');
  
  // Step 0.5: Convert tab-delimited table rows to pipe-delimited
  // This catches LLM output that uses tabs instead of pipes for tables
  normalized = normalized.replace(/^([^\t\n|]+\t[^\t\n]+(?:\t[^\t\n]+)*)$/gm, (match) => {
    // If line has multiple tabs, convert to pipe-delimited table format
    const parts = match.split('\t');
    if (parts.length >= 2) {
      return '| ' + parts.join(' | ') + ' |';
    }
    return match;
  });
  
  // Step 1: Fix Windows line endings
  normalized = normalized.replace(/\r\n/g, '\n');
  
  // Step 2: Fix orphaned punctuation BEFORE any other processing
  // This catches ALL variations in one pass
  normalized = normalized.replace(
    /([^\n])\n+([.,;:!?]+)(\s*)(\n|$)/gm,
    '$1$2$3$4'
  );
  
  // Step 3: Fix citation + bullet patterns
  normalized = normalized.replace(/(\[\d+\])\s*\n\s*•/g, '$1 •');
  
  // Step 4: Fix numbered lists with orphaned periods
  normalized = normalized.replace(/(\d+)\.\s*\n\s*([^\d])/gm, '$1. $2');
  
  // Step 5: Normalize bullet points - but preserve intended line breaks
  normalized = normalized.replace(/\n\s*•\s*/g, '\n• ');
  
  // Step 6: Clean up excessive whitespace
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  normalized = normalized.replace(/[ \t]+/g, ' ');
  
  return normalized;
};

// ============= TOKENIZER =============
// Convert text into structured tokens for processing
interface Token {
  type: 'text' | 'bold' | 'italic' | 'code' | 'code-block' | 'header' | 
        'list-item' | 'checkbox' | 'bullet' | 'blockquote' | 'table' | 
        'hr' | 'link' | 'citation' | 'citation-placeholder' | 'paragraph-break' | 'verbatim-quote';
  content: string;
  metadata?: any;
}

const tokenizeText = (text: string): Token[] => {
  const tokens: Token[] = [];
  
  // Process line by line for block elements
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let tableLines: string[] = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        tokens.push({
          type: 'code-block',
          content: codeBlockContent.join('\n')
        });
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Tables - more robust detection
    if (line.includes('|') && !inTable) {
      const pipeCount = (line.match(/\|/g) || []).length;
      // Check if this looks like a table row (at least 2 pipes for header|content)
      if (pipeCount >= 2) {
        // Look ahead for separator row (may be next line or line after)
        const lookAhead = [lines[i + 1], lines[i + 2]].filter(Boolean);
        const hasSeparator = lookAhead.some(l => l?.includes('|') && l?.includes('-'));
        
        if (hasSeparator) {
          inTable = true;
          tableLines = [line];
          continue;
        }
      }
    }
    
    if (inTable) {
      if (line.includes('|') || line.trim() === '') {
        // Include lines with pipes or empty lines within table
        if (line.trim() !== '') {
          tableLines.push(line);
        }
      } else {
        // End of table
        tokens.push({
          type: 'table',
          content: tableLines.join('\n')
        });
        tableLines = [];
        inTable = false;
        i--; // Re-process this line
      }
      continue;
    }
    
    // Headers
    if (line.match(/^#{1,6}\s+/)) {
      const level = line.match(/^(#{1,6})/)?.[1].length || 1;
      tokens.push({
        type: 'header',
        content: line.replace(/^#{1,6}\s+/, ''),
        metadata: { level }
      });
      continue;
    }
    
    // Lists
    if (line.match(/^\d+\.\s+/)) {
      tokens.push({
        type: 'list-item',
        content: line.replace(/^\d+\.\s+/, ''),
        metadata: { number: line.match(/^(\d+)/)?.[1] }
      });
      continue;
    }
    
    if (line.match(/^([-•]\s+|\*\s+)/)) {
      tokens.push({
        type: 'bullet',
        content: line.replace(/^([-•]\s+|\*\s+)/, '')
      });
      continue;
    }
    
    if (line.match(/^✅\s+/)) {
      tokens.push({
        type: 'checkbox',
        content: line.replace(/^✅\s+/, '')
      });
      continue;
    }
    
    // Blockquotes
    if (line.match(/^>\s+/)) {
      tokens.push({
        type: 'blockquote',
        content: line.replace(/^>\s+/, '')
      });
      continue;
    }
    
    // Horizontal rules
    if (line.match(/^---+$/)) {
      tokens.push({ type: 'hr', content: '' });
      continue;
    }
    
    // Empty lines = paragraph breaks
    if (line.trim() === '') {
      if (tokens[tokens.length - 1]?.type !== 'paragraph-break') {
        tokens.push({ type: 'paragraph-break', content: '' });
      }
      continue;
    }
    
    // Regular text - now we process inline elements
    tokenizeInline(line, tokens);
  }
  
  // Handle remaining table
  if (inTable && tableLines.length > 0) {
    tokens.push({
      type: 'table',
      content: tableLines.join('\n')
    });
  }
  
  return tokens;
};

const tokenizeInline = (text: string, tokens: Token[]) => {
  // Process inline elements including verbatim quotes
  const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\)|\{\{CITATION_\d+\}\}|\{\{VERBATIM_QUOTE_(\d+):(.*?)\}\}|\[\d+:\d+\s+source\])/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = inlinePattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    const fullMatch = match[0];
    
    // Verbatim quote (check first due to overlapping patterns)
    if (match[4] && match[5]) {
      tokens.push({ 
        type: 'verbatim-quote', 
        content: match[5],
        metadata: { citationNumber: parseInt(match[4]) }
      });
    }
    // Bold
    else if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
      tokens.push({
        type: 'bold',
        content: fullMatch.slice(2, -2)
      });
    }
    // Italic
    else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
      tokens.push({
        type: 'italic',
        content: fullMatch.slice(1, -1)
      });
    }
    // Code
    else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      tokens.push({
        type: 'code',
        content: fullMatch.slice(1, -1)
      });
    }
    // Links
    else if (fullMatch.startsWith('[')) {
      if (fullMatch.includes('](')) {
        tokens.push({
          type: 'link',
          content: match[2],
          metadata: { href: match[3] }
        });
      } else if (fullMatch.match(/\[\d+:\d+\s+source\]/)) {
        tokens.push({
          type: 'citation',
          content: fullMatch
        });
      }
    }
    // Citation placeholders
    else if (fullMatch.startsWith('{{CITATION_')) {
      tokens.push({
        type: 'citation-placeholder',
        content: fullMatch
      });
    }
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
};

// ============= RENDERER =============
const renderTokens = (
  tokens: Token[],
  responseLength: string,
  sources?: SourceData[],
  citationMap?: Map<string, any>
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let currentParagraph: React.ReactNode[] = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <div key={elements.length} className="mb-3 leading-[1.75] font-normal text-[15px]">
          {currentParagraph}
        </div>
      );
      currentParagraph = [];
    }
  };
  
  tokens.forEach((token, index) => {
    switch (token.type) {
      case 'paragraph-break':
        flushParagraph();
        break;
        
      case 'header':
        flushParagraph();
        const HeaderTag = `h${token.metadata.level}` as keyof React.JSX.IntrinsicElements;
        const headerClass = getHeaderClass(token.metadata.level, responseLength);
        elements.push(
          <div key={index} className="my-8">
            <HeaderTag className={`font-bold ${headerClass}`}>
              {renderInlineTokens(tokenizeInlineForRender(token.content), responseLength, sources, citationMap)}
            </HeaderTag>
          </div>
        );
        break;
        
      case 'list-item':
        flushParagraph();
        elements.push(
          <div key={index} className="my-1 flex items-start">
            <div className="min-w-[1.5rem] text-brand-yellow/80 font-extrabold mr-3 mt-0 text-base">
              {token.metadata.number}.
            </div>
            <div className="leading-normal font-normal flex-1">
              {renderInlineTokens(tokenizeInlineForRender(token.content), responseLength, sources, citationMap)}
            </div>
          </div>
        );
        break;
        
      case 'bullet':
        flushParagraph();
        elements.push(
          <div key={index} className="my-1 flex items-start">
            <div className="w-2 h-2 bg-current opacity-50 rounded-full mr-3 mt-2 flex-shrink-0"></div>
            <div className="leading-normal font-normal flex-1">
              {renderInlineTokens(tokenizeInlineForRender(token.content), responseLength, sources, citationMap)}
            </div>
          </div>
        );
        break;

      case 'checkbox':
        flushParagraph();
        elements.push(
          <div key={index} className="my-1 flex items-start">
            <div className="mr-3 mt-0.5">✅</div>
            <div className="leading-normal font-normal flex-1">
              {renderInlineTokens(tokenizeInlineForRender(token.content), responseLength, sources, citationMap)}
            </div>
          </div>
        );
        break;

      case 'blockquote':
        flushParagraph();
        elements.push(
          <div key={index} className="my-4 pl-4 border-l-4 border-current/30 opacity-80 italic">
            {renderInlineTokens(tokenizeInlineForRender(token.content), responseLength, sources, citationMap)}
          </div>
        );
        break;
        
      case 'code-block':
        flushParagraph();
        elements.push(
          <div key={index} className="my-4 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-lg overflow-hidden relative text-[var(--chat-text)]">
            <div className="bg-[var(--chat-card-2)] px-4 py-2 text-xs text-[var(--chat-muted)] font-medium border-b border-[var(--chat-border)]">
              Code
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code>{token.content}</code>
            </pre>
            <CopyButton text={token.content} />
          </div>
        );
        break;
        
      case 'table':
        flushParagraph();
        elements.push(renderTable(token.content, index, responseLength, sources, citationMap));
        break;
        
      case 'hr':
        flushParagraph();
        elements.push(
          <div key={index} className="my-8">
            <hr className="border-t border-[var(--chat-border)]" />
          </div>
        );
        break;
        
      case 'citation-placeholder':
        if (citationMap && sources) {
          const citationData = citationMap.get(token.content);
          if (citationData) {
            currentParagraph.push(
              <CitationMarker
                key={index}
                citationNumber={citationData.citationNumber}
                sourceData={citationData.sourceData}
                allSources={sources}
                excerpt={citationData.excerpt}
              />
            );
          }
        }
        break;
        
      default:
        // Inline elements go into current paragraph
        currentParagraph.push(renderInlineToken(token, index, responseLength, sources, citationMap));
    }
  });
  
  flushParagraph();
  return elements;
};

// Helper to tokenize inline content for rendering
const tokenizeInlineForRender = (text: string): Token[] => {
  const tokens: Token[] = [];
  tokenizeInline(text, tokens);
  return tokens;
};

const renderInlineToken = (
  token: Token, 
  key: number, 
  responseLength: string,
  sources?: SourceData[],
  citationMap?: Map<string, any>
): React.ReactNode => {
  const boldClass =
    responseLength === 'short' ? 'font-bold' :
    (responseLength === 'long' || responseLength === 'detailed') ? 'font-black' :
    'font-extrabold';
    
  switch (token.type) {
    case 'verbatim-quote':
      // Render verbatim quotes with blue, italic styling and quotation marks
      return (
        <span key={key} className="inline">
          <span className="italic text-brand-yellow/80">
            "{token.content}"
          </span>
          {token.metadata?.citationNumber && sources && sources[token.metadata.citationNumber - 1] && (
            <CitationMarker
              citationNumber={token.metadata.citationNumber}
              sourceData={sources[token.metadata.citationNumber - 1]}
              allSources={sources}
            />
          )}
        </span>
      );
    case 'bold':
      return <strong key={key} className={boldClass}>{token.content}</strong>;
    case 'italic':
      return <em key={key} className="italic opacity-90 font-normal">{token.content}</em>;
    case 'code':
      return (
        <code key={key} className="bg-[var(--chat-card-2)] text-current px-2 py-0.5 rounded font-mono text-[13px] mx-0.5 border border-[var(--chat-border)] font-normal">
          {token.content}
        </code>
      );
    case 'link':
      return (
        <a key={key} href={token.metadata.href} target="_blank" rel="noopener noreferrer"
           className="text-brand-yellow/80 hover:text-brand-yellow underline decoration-brand-yellow/30">
          {token.content} ↗
        </a>
      );
    case 'citation-placeholder':
      if (citationMap && sources) {
        const citationData = citationMap.get(token.content);
        if (citationData) {
          return (
            <CitationMarker
              key={key}
              citationNumber={citationData.citationNumber}
              sourceData={citationData.sourceData}
              allSources={sources}
              excerpt={citationData.excerpt}
            />
          );
        }
      }
      return null;
    case 'text':
      return <span key={key}>{token.content}</span>;
    default:
      return <span key={key}>{token.content}</span>;
  }
};

const renderInlineTokens = (
  tokens: Token[], 
  responseLength: string,
  sources?: SourceData[],
  citationMap?: Map<string, any>
): React.ReactNode[] => {
  return tokens.map((token, i) => renderInlineToken(token, i, responseLength, sources, citationMap));
};

const renderTable = (
  content: string, 
  key: number, 
  responseLength: string,
  sources?: SourceData[],
  citationMap?: Map<string, any>
): React.ReactNode => {
  const rows = content.split('\n').filter(row => row.trim());
  // Skip separator rows (rows with only |, -, and spaces)
  const filteredRows = rows.filter(row => !row.match(/^[\s|:-]+$/));
  
  if (filteredRows.length === 0) return null;
  
  const headers = filteredRows[0].split('|').map(h => h.trim()).filter(h => h);
  const dataRows = filteredRows.slice(1).map(row => 
    row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
  );
  
  return (
    <div key={key} className="my-6 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-lg overflow-hidden overflow-x-auto text-[var(--chat-text)]">
      <Table className="text-[var(--chat-text)]">
        <TableHeader>
          <TableRow>
            {headers.map((header, i) => (
              <TableHead key={i}>
                {renderInlineTokens(tokenizeInlineForRender(header), responseLength, sources, citationMap)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>
                  {renderInlineTokens(tokenizeInlineForRender(cell), responseLength, sources, citationMap)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const getHeaderClass = (level: number, length: string) => {
  if (length === 'short') {
    return level === 1 ? 'text-xl mb-3 font-bold' :
           level === 2 ? 'text-lg mb-2 font-semibold' :
           'text-base mb-2 font-medium';
  } else if (length === 'long' || length === 'detailed') {
    return level === 1 ? 'text-4xl mb-8 border-b border-[var(--chat-border)] pb-4 font-extrabold tracking-tight' :
           level === 2 ? 'text-3xl mb-6 font-bold tracking-tight' :
           level === 3 ? 'text-2xl mb-4 font-bold' :
           'text-xl mb-3 font-bold';
  } else {
    return level === 1 ? 'text-3xl mb-6 border-b border-[var(--chat-border)] pb-3 font-extrabold' :
           level === 2 ? 'text-2xl mb-4 font-bold' :
           level === 3 ? 'text-xl mb-3 font-bold' :
           'text-lg mb-2 font-bold';
  }
};

// ============= MAIN EXPORT =============
export const parseMarkdownBold = (
  text: string,
  responseLength?: string,
  sources?: SourceData[]
): React.ReactNode => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
   // Step 0: XSS Defense - Sanitize LLM response
   // Log suspicious content for monitoring (non-blocking)
   const suspiciousCheck = detectSuspiciousContent(text);
   if (suspiciousCheck.hasSuspiciousPatterns) {
     console.warn('[Security] Suspicious patterns detected in LLM response:', suspiciousCheck.patterns);
   }
   
   // Sanitize before any processing
   const sanitizedText = sanitizeLLMResponse(text);
   
   // Step 1: Single normalization pass
   let processedText = normalizeTextOnce(sanitizedText);
  
  // Step 2: Extract citations if sources available
  let citationMap = new Map<string, any>();
  if (sources && sources.length > 0) {
    const { textWithPlaceholders, citations } = extractCitations(processedText, sources);
    processedText = textWithPlaceholders;
    
    citations.forEach(citation => {
      const sourceData = sources[citation.sourceIndex];
      citationMap.set(citation.placeholder, {
        citationNumber: citation.citationNumber,
        sourceData,
        excerpt: sourceData.excerpt?.substring(0, 150) || 'No excerpt available'
      });
    });
    
    // Step 2.5: Handle direct {{CITATION_X}} output from LLM
    // Sometimes the LLM outputs citation placeholders directly without going through [X] format
    const directCitationRegex = /\{\{CITATION_(\d+)\}\}/g;
    let directMatch;
    while ((directMatch = directCitationRegex.exec(processedText)) !== null) {
      const citationNumber = parseInt(directMatch[1], 10);
      const sourceIndex = citationNumber - 1;
      const placeholder = directMatch[0];
      
      // Only add if not already in map and source exists
      if (!citationMap.has(placeholder) && sourceIndex >= 0 && sourceIndex < sources.length) {
        const sourceData = sources[sourceIndex];
        citationMap.set(placeholder, {
          citationNumber,
          sourceData,
          excerpt: sourceData.excerpt?.substring(0, 150) || 'No excerpt available'
        });
      }
    }
  }
  
  // Step 3: Tokenize
  const tokens = tokenizeText(processedText);
  
  // Step 4: Render
  return renderTokens(tokens, responseLength || 'medium', sources, citationMap);
};
