import { generateJSON } from '@tiptap/react';
import { marked } from 'marked';
import { canvasExtensions } from './extensions';
import { sanitizeMarkdown } from '@/utils/sanitize';

/** Convert a markdown source string into a TipTap-compatible ProseMirror JSON doc. */
export function markdownToTiptap(markdown: string): unknown {
  const html = sanitizeMarkdown(marked.parse(markdown || '', { async: false }) as string);
  try {
    return generateJSON(html, canvasExtensions as never);
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: markdown }] }] };
  }
}

/** Extract plain text from a TipTap JSON document for search/indexing. */
export function tiptapToPlainText(doc: unknown): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (typeof n.text === 'string') parts.push(n.text);
    if (Array.isArray(n.content)) {
      n.content.forEach(walk);
      if (n.type === 'paragraph' || n.type?.startsWith('heading') || n.type === 'listItem') {
        parts.push('\n');
      }
    }
  };
  walk(doc);
  return parts.join('').trim();
}
