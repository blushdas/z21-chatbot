/**
 * Utility functions for consistent title handling across the application
 */

export const cleanTitle = (title: string): string => {
  if (!title || title.trim() === '') return '';
  
  // Remove emojis from the beginning of the title using Unicode regex
  return title.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/gu, '').trim();
};

export const getDisplayTitle = (title: string, fallback: string = 'New Chat'): string => {
  if (!title || title.trim() === '' || title === 'New Chat') {
    return fallback;
  }
  
  // For display purposes, we might want to keep the original title with emojis
  // but clean versions are used in specific components like the sidebar
  return title.trim();
};

export const shouldShowTitle = (title: string): boolean => {
  return title && title.trim() !== '' && title !== 'New Chat';
};
