
const generateTitle = (firstMessage: string): string => {
  if (!firstMessage?.trim()) return "New Chat";
  
  let clean = firstMessage.trim()
    .replace(/^(coaching|family|investor|ambassador|faith|leadership)\s*[-:]\s*/i, '')
    .replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/gu, '')
    .replace(/^\[[\w\s]+\]\s*/i, '')
    .replace(/^(hi|hello|hey)\s*[,!.]?\s*/i, '')
    .replace(/^(can you|could you|please)\s*/i, '');
  
  if (clean.length > 50) {
    clean = clean.substring(0, 47) + "...";
  }
  
  return clean || "New Chat";
};

export { generateTitle };
