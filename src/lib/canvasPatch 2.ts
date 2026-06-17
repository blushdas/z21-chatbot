import type { Editor } from '@tiptap/react';

export type CanvasOperation =
  | { op: 'replace_all'; html: string }
  | { op: 'append'; html: string }
  | { op: 'prepend'; html: string }
  | { op: 'replace_section'; heading: string; html: string }
  | { op: 'insert_after_heading'; heading: string; html: string };

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Find a heading node in the doc whose text matches `heading` (case/whitespace
 * insensitive). Returns the heading's start/end positions and its level, or
 * null when no match.
 */
function findHeading(editor: Editor, heading: string) {
  const target = norm(heading);
  let found: { from: number; to: number; level: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name === 'heading' && norm(node.textContent) === target) {
      found = {
        from: pos,
        to: pos + node.nodeSize,
        level: (node.attrs?.level as number) ?? 1,
      };
      return false;
    }
    return true;
  });
  return found;
}

/**
 * Find the end position of the section that starts at the given heading —
 * i.e. the position right before the next heading of equal-or-higher level,
 * or the end of the document.
 */
function findSectionEnd(editor: Editor, headingFrom: number, level: number): number {
  const doc = editor.state.doc;
  let end = doc.content.size;
  doc.descendants((node, pos) => {
    if (pos <= headingFrom) return true;
    if (node.type.name === 'heading') {
      const lvl = (node.attrs?.level as number) ?? 1;
      if (lvl <= level) {
        end = pos;
        return false;
      }
    }
    return true;
  });
  return end;
}

function applyOne(editor: Editor, op: CanvasOperation): boolean {
  switch (op.op) {
    case 'replace_all':
      editor
        .chain()
        .focus()
        .setContent(op.html, { parseOptions: { preserveWhitespace: false } })
        .run();
      return true;
    case 'append': {
      const end = editor.state.doc.content.size;
      editor.chain().focus().insertContentAt(end, op.html).run();
      return true;
    }
    case 'prepend': {
      editor.chain().focus().insertContentAt(0, op.html).run();
      return true;
    }
    case 'replace_section': {
      const h = findHeading(editor, op.heading);
      if (!h) {
        // Fall back to append so the user still sees their content.
        const end = editor.state.doc.content.size;
        editor.chain().focus().insertContentAt(end, op.html).run();
        return true;
      }
      const sectionEnd = findSectionEnd(editor, h.from, h.level);
      editor
        .chain()
        .focus()
        .insertContentAt({ from: h.from, to: sectionEnd }, op.html)
        .run();
      return true;
    }
    case 'insert_after_heading': {
      const h = findHeading(editor, op.heading);
      if (!h) {
        const end = editor.state.doc.content.size;
        editor.chain().focus().insertContentAt(end, op.html).run();
        return true;
      }
      editor.chain().focus().insertContentAt(h.to, op.html).run();
      return true;
    }
    default:
      return false;
  }
}

export function applyCanvasOperations(editor: Editor, ops: CanvasOperation[]): number {
  let applied = 0;
  for (const op of ops) {
    try {
      if (applyOne(editor, op)) applied += 1;
    } catch (e) {
      console.error('applyCanvasOperations: failed op', op, e);
    }
  }
  return applied;
}
