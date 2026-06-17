import { SourceData } from '@/hooks/useSourceDrawer';

export interface ParsedCitation {
  citationNumber: number;
  sourceIndex: number;
  position: number;
  placeholder: string;
}

export interface CitationExtractionResult {
  textWithPlaceholders: string;
  citations: ParsedCitation[];
  invalidCitations: number[];
}

/**
 * Detect if the end of text contains a cluster of multiple citations
 * that should be filtered out (e.g., "[2][3][4][5][6][7][8]")
 */
function detectEndCitationCluster(text: string): {
  hasCluster: boolean;
  clusterStartPos: number;
} {
  // Get the last paragraph/line (after last \n\n, or last 200 chars)
  const lastParagraphMatch = text.match(/(?:\n\n)([^\n]+)$/);
  const lastLine = lastParagraphMatch ? lastParagraphMatch[1] : text.slice(-200);
  const lastLineStartPos = lastParagraphMatch 
    ? text.length - lastParagraphMatch[1].length 
    : Math.max(0, text.length - 200);
  
  // Pattern: 3+ citations in close proximity (with optional commas/spaces)
  // Examples: "[1][2][3]", "[1], [2], [3]", "[2][3][4][5]"
  const clusterPattern = /\[(\d+)\](?:\s*,?\s*\[(\d+)\]){2,}/g;
  const match = clusterPattern.exec(lastLine);
  
  if (match) {
    return {
      hasCluster: true,
      clusterStartPos: lastLineStartPos + match.index
    };
  }
  
  return { hasCluster: false, clusterStartPos: -1 };
}

/**
 * Extract citation markers [1], [2], etc. from text and replace with placeholders
 * Maps citation numbers to source indices and validates against available sources
 */
export function extractCitations(
  text: string,
  sources: SourceData[]
): CitationExtractionResult {
  if (!text) {
    return {
      textWithPlaceholders: text,
      citations: [],
      invalidCitations: []
    };
  }
  
  // ✅ FIX: If no sources, still clean up citation markers to prevent raw [N] in output
  if (!sources || sources.length === 0) {
    const cleanedText = text
      .replace(/\[\d+\]/g, '')           // Remove complete [N] markers
      .replace(/\[F\d+\]/g, '')          // Remove legacy folder markers from cached replies
      .replace(/\[\d*\s*$/g, '')          // Remove trailing incomplete [ or [N
      .trim();
    
    return {
      textWithPlaceholders: cleanedText,
      citations: [],
      invalidCitations: []
    };
  }

  // Detect and filter end citation clusters
  const { hasCluster, clusterStartPos } = detectEndCitationCluster(text);

  const citations: ParsedCitation[] = [];
  const invalidCitations: number[] = [];
  let textWithPlaceholders = text;
  let offset = 0;

  // Find all citation markers [1], [2], etc.
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const citationNumber = parseInt(match[1], 10);
    const sourceIndex = citationNumber - 1; // Convert 1-indexed to 0-indexed
    const position = match.index;

    // Skip citations that are part of end cluster
    if (hasCluster && position >= clusterStartPos) {
      console.log(`🧹 Filtering out end-of-response citation [${citationNumber}] at position ${position}`);
      continue;
    }

    // Validate citation number against available sources
    if (sourceIndex >= 0 && sourceIndex < sources.length) {
      const placeholder = `{{CITATION_${citationNumber}}}`;
      
      citations.push({
        citationNumber,
        sourceIndex,
        position: position + offset,
        placeholder
      });

      // Replace citation marker with placeholder
      const beforePlaceholder = textWithPlaceholders.substring(0, position + offset);
      const afterPlaceholder = textWithPlaceholders.substring(position + offset + match[0].length);
      textWithPlaceholders = beforePlaceholder + placeholder + afterPlaceholder;
      
      // Update offset due to length change
      offset += placeholder.length - match[0].length;
    } else {
      // Invalid citation - remove it from the text entirely to prevent broken UI
      invalidCitations.push(citationNumber);
      console.warn(`⚠️ Removing invalid citation [${citationNumber}] from text. Only ${sources.length} sources available.`);
      
      // Remove the citation marker by not replacing it with a placeholder
      // The offset doesn't change since we're effectively deleting the match
    }
  }

  // If we removed cluster, clean up the text
  if (hasCluster) {
    // Remove the cluster pattern AND any trailing punctuation/whitespace
    const clusterPattern = /\[(\d+)\](?:\s*,?\s*\[(\d+)\]){2,}\s*[:\.,;]?\s*/g;
    textWithPlaceholders = textWithPlaceholders.replace(clusterPattern, '').trim();
  }

  if (invalidCitations.length > 0) {
    console.warn(`⚠️ Found ${invalidCitations.length} invalid citation(s): [${invalidCitations.join(', ')}]`);
  }

  console.log(`📚 Extracted ${citations.length} valid citations (filtered end clusters: ${hasCluster})`);

  return {
    textWithPlaceholders,
    citations,
    invalidCitations
  };
}

/**
 * Validate citations against available sources
 */
export function validateCitations(
  citations: ParsedCitation[],
  sources: SourceData[]
): {
  valid: ParsedCitation[];
  invalid: ParsedCitation[];
} {
  const valid = citations.filter(c => c.sourceIndex < sources.length);
  const invalid = citations.filter(c => c.sourceIndex >= sources.length);

  if (invalid.length > 0) {
    console.warn(
      `⚠️ Invalid citations detected: ${invalid.map(c => `[${c.citationNumber}]`).join(', ')}. ` +
      `Only ${sources.length} sources available.`
    );
  }

  return { valid, invalid };
}
