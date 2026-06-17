 /**
  * DOMPurify-based HTML sanitization for XSS defense-in-depth
  * Used to sanitize LLM responses before rendering in markdown parser
  */
 import DOMPurify, { Config } from 'dompurify';
 
 /**
  * Default configuration for DOMPurify
  * Allows only safe HTML elements commonly used in markdown
  */
 const DEFAULT_CONFIG: Config = {
   ALLOWED_TAGS: [
     // Text formatting
     'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'del', 'ins', 'mark',
     // Structure
     'p', 'br', 'hr', 'div', 'span',
     // Headers
     'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
     // Lists
     'ul', 'ol', 'li',
     // Tables
     'table', 'thead', 'tbody', 'tr', 'th', 'td',
     // Links (href only)
     'a',
     // Code
     'code', 'pre',
     // Blockquotes
     'blockquote',
   ],
   ALLOWED_ATTR: [
     'href', 'target', 'rel', 'class', 'id',
     'colspan', 'rowspan', // For tables
   ],
   // Ensure links open safely
   ADD_ATTR: ['target', 'rel'],
   // Force safe link handling
   ALLOW_DATA_ATTR: false,
   // Forbid potentially dangerous protocols
   ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
 };
 
 /**
  * Escape HTML entities in a string
  * This is the first line of defense - converts special chars to HTML entities
  */
 export function escapeHtml(text: string): string {
   const htmlEscapes: Record<string, string> = {
     '&': '&amp;',
     '<': '&lt;',
     '>': '&gt;',
     '"': '&quot;',
     "'": '&#39;',
   };
   return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
 }
 
 /**
  * Sanitize markdown content using DOMPurify
  * Removes potentially dangerous HTML while preserving safe elements
  * 
  * @param html - Raw HTML/markdown content
  * @param config - Optional custom DOMPurify configuration
  * @returns Sanitized HTML string
  */
 export function sanitizeMarkdown(html: string, config?: Partial<Config>): string {
   if (!html || typeof html !== 'string') {
     return '';
   }
   
   const mergedConfig = { ...DEFAULT_CONFIG, ...config };
 return DOMPurify.sanitize(html, mergedConfig) as string;
 }
 
 /**
  * Sanitize LLM response content for safe rendering
  * This is specifically designed for AI-generated content which may contain
  * unexpected HTML or script injections
  * 
  * @param response - Raw LLM response text
  * @returns Sanitized response safe for rendering
  */
 export function sanitizeLLMResponse(response: string): string {
   if (!response || typeof response !== 'string') {
     return '';
   }
   
   // For LLM responses, we escape HTML entities first since LLM output
   // should be treated as plain text with markdown formatting
   // Script tags and other HTML should be displayed as text, not executed
   
   // Step 1: Escape any raw HTML that shouldn't be rendered
   // We preserve markdown syntax but escape HTML tags
   let sanitized = response;
   
   // Escape script/style tags completely - these should never be in LLM output
   sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, (match) => {
     return escapeHtml(match);
   });
   sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, (match) => {
     return escapeHtml(match);
   });
   
   // Escape event handlers (onclick, onerror, etc.)
   sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
   
   // Escape javascript: protocol
   sanitized = sanitized.replace(/javascript:/gi, 'javascript-blocked:');
   
   // Escape data: URLs that could contain scripts
   sanitized = sanitized.replace(/data:text\/html/gi, 'data-blocked:text/html');
   
   // Step 2: Run through DOMPurify as final safety net
   return sanitizeMarkdown(sanitized);
 }
 
 /**
  * Check if content contains potentially dangerous patterns
  * Useful for logging/monitoring without blocking
  * 
  * @param content - Content to check
  * @returns Object with detection results
  */
 export function detectSuspiciousContent(content: string): {
   hasSuspiciousPatterns: boolean;
   patterns: string[];
 } {
   const patterns: string[] = [];
   
   if (/<script/i.test(content)) patterns.push('script_tag');
   if (/on\w+\s*=/i.test(content)) patterns.push('event_handler');
   if (/javascript:/i.test(content)) patterns.push('javascript_protocol');
   if (/<iframe/i.test(content)) patterns.push('iframe_tag');
   if (/<object/i.test(content)) patterns.push('object_tag');
   if (/<embed/i.test(content)) patterns.push('embed_tag');
   if (/data:text\/html/i.test(content)) patterns.push('data_html_url');
   
   return {
     hasSuspiciousPatterns: patterns.length > 0,
     patterns,
   };
 }