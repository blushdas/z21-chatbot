import React from 'react';

interface FAQAnswerProps {
  content: string;
}

const FAQAnswer: React.FC<FAQAnswerProps> = ({ content }) => {
  // Split content into sections (paragraphs separated by double newlines)
  const sections = content.split('\n\n').filter(Boolean);

  const renderInlineFormatting = (text: string) => {
    // Simple split approach instead of complex regex
    const parts: (string | React.JSX.Element)[] = [];
    const segments = text.split(/(\*\*[^*]+\*\*)/g);
    
    segments.forEach((segment, idx) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        // Bold text
        const boldText = segment.slice(2, -2);
        parts.push(
          <strong key={`bold-${idx}`} className="font-semibold text-foreground">
            {boldText}
          </strong>
        );
      } else if (segment) {
        // Regular text
        parts.push(segment);
      }
    });

    return parts.length > 0 ? parts : text;
  };

  const renderSection = (section: string, index: number) => {
    const trimmedSection = section.trim();

    // Check if it's a bold header (starts with **)
    if (trimmedSection.startsWith('**') && trimmedSection.includes(':**')) {
      const headerText = trimmedSection.replace(/\*\*/g, '').replace(':', '');
      return (
        <h4 key={index} className="font-semibold text-foreground mt-4 mb-2">
          {headerText}
        </h4>
      );
    }

    // Check if it's a bulleted list (lines starting with *)
    if (trimmedSection.includes('\n*')) {
      const items = trimmedSection
        .split('\n')
        .filter(line => line.trim().startsWith('*'))
        .map(line => line.trim().replace(/^\*\s*/, ''));

      return (
        <ul key={index} className="list-disc pl-6 space-y-2 mb-4">
          {items.map((item, itemIndex) => (
            <li key={`list-${index}-${itemIndex}`} className="text-muted-foreground leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
    }

    // Check if it's a numbered list
    if (/^\d+\./.test(trimmedSection)) {
      const items = trimmedSection
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.trim().replace(/^\d+\.\s*/, ''));

      return (
        <ol key={index} className="list-decimal pl-6 space-y-2 mb-4">
          {items.map((item, itemIndex) => (
            <li key={`numlist-${index}-${itemIndex}`} className="text-muted-foreground leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
    }

    // Regular paragraph
    return (
      <p key={index} className="text-muted-foreground leading-relaxed mb-4">
        {renderInlineFormatting(trimmedSection)}
      </p>
    );
  };

  return (
    <div className="space-y-2">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  );
};

export default FAQAnswer;
