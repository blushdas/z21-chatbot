import type { Editor } from '@tiptap/react';
import TurndownService from 'turndown';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ExternalHyperlink, LevelFormat,
} from 'docx';

export function buildExportHtml(title: string, bodyHtml: string): string {
  const safeTitle = (title || 'Canvas').replace(/</g, '&lt;');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  :root { color-scheme: light; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111;
    max-width: 780px;
    margin: 48px auto;
    padding: 0 24px;
    line-height: 1.6;
    font-size: 16px;
  }
  h1, h2, h3, h4 { line-height: 1.25; margin-top: 1.4em; }
  h1 { font-size: 2em; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.25em; }
  p { margin: 0.6em 0; }
  ul, ol { padding-left: 1.4em; }
  blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding: 0.2em 1em; color: #555; }
  code { background: #f4f4f5; padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.92em; }
  pre { background: #f4f4f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
  hr { border: 0; border-top: 1px solid #e5e5e5; margin: 2em 0; }
  a { color: #2563eb; }
  img { max-width: 100%; height: auto; }
  @media print {
    body { margin: 0; padding: 24px; max-width: none; }
  }
</style>
</head>
<body>
<h1>${safeTitle}</h1>
${bodyHtml}
</body>
</html>`;
}

export function downloadBlob(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBlobObject(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function htmlToMarkdown(html: string): string {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  return td.turndown(html);
}

type InlineStyle = {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  link?: string;
};

function collectRuns(node: Node, style: InlineStyle, runs: Array<TextRun | ExternalHyperlink>): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (!text) return;
    const run = new TextRun({
      text,
      bold: style.bold,
      italics: style.italics,
      underline: style.underline ? {} : undefined,
      strike: style.strike,
      font: style.code ? 'Courier New' : undefined,
    });
    if (style.link) {
      runs.push(new ExternalHyperlink({ link: style.link, children: [run] }));
    } else {
      runs.push(run);
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'br') {
    runs.push(new TextRun({ text: '', break: 1 }));
    return;
  }
  const next: InlineStyle = { ...style };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italics = true;
  if (tag === 'u') next.underline = true;
  if (tag === 's' || tag === 'strike' || tag === 'del') next.strike = true;
  if (tag === 'code') next.code = true;
  if (tag === 'a') {
    const href = el.getAttribute('href');
    if (href) next.link = href;
  }
  el.childNodes.forEach((child) => collectRuns(child, next, runs));
}

function makeParagraph(el: HTMLElement, opts: Record<string, unknown> = {}): Paragraph {
  const runs: Array<TextRun | ExternalHyperlink> = [];
  el.childNodes.forEach((child) => collectRuns(child, {}, runs));
  return new Paragraph({ ...(opts as any), children: runs.length ? runs : [new TextRun('')] });
}

const HEADING_MAP: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
};

function blockToParagraphs(el: HTMLElement, listCtx?: { ref: 'bullets' | 'numbers'; level: number }): Paragraph[] {
  const tag = el.tagName.toLowerCase();

  if (HEADING_MAP[tag]) {
    return [makeParagraph(el, { heading: HEADING_MAP[tag] })];
  }
  if (tag === 'p' || tag === 'div') {
    const opts: Record<string, unknown> = {};
    if (listCtx) opts.numbering = { reference: listCtx.ref, level: listCtx.level };
    return [makeParagraph(el, opts)];
  }
  if (tag === 'blockquote') {
    return [makeParagraph(el, { indent: { left: 720 }, italics: true } as any)];
  }
  if (tag === 'pre') {
    const text = el.textContent ?? '';
    return text.split('\n').map((line) => new Paragraph({
      children: [new TextRun({ text: line, font: 'Courier New' })],
    }));
  }
  if (tag === 'hr') {
    return [new Paragraph({
      border: { bottom: { style: 'single' as any, size: 6, color: 'CCCCCC', space: 1 } },
      children: [new TextRun('')],
    })];
  }
  if (tag === 'ul' || tag === 'ol') {
    const ref: 'bullets' | 'numbers' = tag === 'ul' ? 'bullets' : 'numbers';
    const level = listCtx ? Math.min(listCtx.level + 1, 5) : 0;
    const out: Paragraph[] = [];
    el.childNodes.forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const li = child as HTMLElement;
      if (li.tagName.toLowerCase() !== 'li') return;
      // Split li contents into the leading inline run + nested blocks.
      const inlineChildren: Node[] = [];
      const blockChildren: HTMLElement[] = [];
      li.childNodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          const childTag = (n as HTMLElement).tagName.toLowerCase();
          if (childTag === 'ul' || childTag === 'ol' || HEADING_MAP[childTag] || childTag === 'p' || childTag === 'blockquote' || childTag === 'pre' || childTag === 'hr') {
            blockChildren.push(n as HTMLElement);
            return;
          }
        }
        inlineChildren.push(n);
      });
      const runs: Array<TextRun | ExternalHyperlink> = [];
      inlineChildren.forEach((n) => collectRuns(n, {}, runs));
      out.push(new Paragraph({
        numbering: { reference: ref, level },
        children: runs.length ? runs : [new TextRun('')],
      }));
      blockChildren.forEach((b) => {
        out.push(...blockToParagraphs(b, { ref, level }));
      });
    });
    return out;
  }
  // Fallback: treat as paragraph with collected inline runs.
  return [makeParagraph(el)];
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return [new Paragraph({ children: [new TextRun('')] })];
  const paragraphs: Paragraph[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim();
      if (text) paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    paragraphs.push(...blockToParagraphs(node as HTMLElement));
  });
  return paragraphs.length ? paragraphs : [new Paragraph({ children: [new TextRun('')] })];
}

export async function htmlToDocxBlob(title: string, bodyHtml: string): Promise<Blob> {
  const children: Paragraph[] = [];
  if (title) {
    children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }));
  }
  children.push(...htmlToDocxParagraphs(bodyHtml || ''));

  const doc = new Document({
    creator: 'Daryle AI',
    title: title || 'Canvas',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [0, 1, 2, 3, 4, 5].map((lvl) => ({
            level: lvl,
            format: LevelFormat.BULLET,
            text: ['•', '◦', '▪', '•', '◦', '▪'][lvl],
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720 * (lvl + 1), hanging: 360 } } },
          })),
        },
        {
          reference: 'numbers',
          levels: [0, 1, 2, 3, 4, 5].map((lvl) => ({
            level: lvl,
            format: LevelFormat.DECIMAL,
            text: `%${lvl + 1}.`,
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720 * (lvl + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(doc);
  return blob;
}

export function sanitizeFilename(name: string): string {
  return (name || 'canvas').trim().replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'canvas';
}

export async function copyCanvasRichText(editor: Editor): Promise<void> {
  const html = editor.getHTML();
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n\n');
  const nav = navigator as Navigator & {
    clipboard: Clipboard & { write?: (data: ClipboardItem[]) => Promise<void> };
  };
  if (nav.clipboard && typeof nav.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined') {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });
    await nav.clipboard.write([item]);
    return;
  }
  await navigator.clipboard.writeText(text);
}

export function printHtmlAsPdf(htmlDoc: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(htmlDoc);
  doc.close();
  const trigger = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }
  };
  if (iframe.contentWindow?.document.readyState === 'complete') {
    setTimeout(trigger, 100);
  } else {
    iframe.onload = () => setTimeout(trigger, 100);
  }
}