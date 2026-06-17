import { DOMParser as PMDOMParser, DOMSerializer, Fragment, Node as PMNode, type Schema, type Mark } from '@tiptap/pm/model';
import { Transform } from '@tiptap/pm/transform';
import { ChangeSet, simplifyChanges } from 'prosemirror-changeset';
import { sanitizeMarkdown } from '@/utils/sanitize';

export type DiffOp =
  | { type: 'equal'; text: string }
  | { type: 'insert'; text: string }
  | { type: 'delete'; text: string };

export interface RichDiff {
  ops: DiffOp[];
  inlineHtml: string;
  stats: { ins: number; del: number; blocks: number };
}

function parseHTMLToDoc(schema: Schema, html: string): PMNode {
  const div = document.createElement('div');
  div.innerHTML = sanitizeMarkdown(html ?? '');
  return PMDOMParser.fromSchema(schema).parse(div);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapMarks(html: string, marks: readonly Mark[]): string {
  let out = html;
  for (const m of marks) {
    switch (m.type.name) {
      case 'bold':
      case 'strong':
        out = `<strong>${out}</strong>`; break;
      case 'italic':
      case 'em':
        out = `<em>${out}</em>`; break;
      case 'strike':
        out = `<s>${out}</s>`; break;
      case 'underline':
        out = `<u>${out}</u>`; break;
      case 'code':
        out = `<code>${out}</code>`; break;
      case 'link': {
        const href = escapeHtml(String((m.attrs as { href?: string }).href ?? ''));
        out = `<a href="${href}" target="_blank" rel="noreferrer">${out}</a>`;
        break;
      }
      default: break;
    }
  }
  return out;
}

const BLOCK_TAGS: Record<string, (n: PMNode) => { open: string; close: string }> = {
  paragraph: () => ({ open: '<p>', close: '</p>' }),
  heading: (n) => {
    const lvl = Math.min(6, Math.max(1, Number((n.attrs as { level?: number }).level ?? 1)));
    return { open: `<h${lvl}>`, close: `</h${lvl}>` };
  },
  blockquote: () => ({ open: '<blockquote>', close: '</blockquote>' }),
  bulletList: () => ({ open: '<ul>', close: '</ul>' }),
  bullet_list: () => ({ open: '<ul>', close: '</ul>' }),
  orderedList: () => ({ open: '<ol>', close: '</ol>' }),
  ordered_list: () => ({ open: '<ol>', close: '</ol>' }),
  listItem: () => ({ open: '<li>', close: '</li>' }),
  list_item: () => ({ open: '<li>', close: '</li>' }),
  taskList: () => ({ open: '<ul data-type="taskList">', close: '</ul>' }),
  taskItem: (n) => {
    const checked = (n.attrs as { checked?: boolean }).checked ? ' data-checked="true"' : '';
    return { open: `<li data-type="taskItem"${checked}>`, close: '</li>' };
  },
  codeBlock: () => ({ open: '<pre><code>', close: '</code></pre>' }),
  code_block: () => ({ open: '<pre><code>', close: '</code></pre>' }),
};

const LEAF_TAGS: Record<string, string> = {
  horizontalRule: '<hr/>',
  horizontal_rule: '<hr/>',
  hardBreak: '<br/>',
  hard_break: '<br/>',
};

/** Sorted, non-overlapping ranges in docB coords where content was inserted. */
function collectInsertedRanges(cs: ChangeSet): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const ch of cs.changes) {
    if (ch.toB > ch.fromB) ranges.push([ch.fromB, ch.toB]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  return ranges;
}

function isInsertedAt(ranges: Array<[number, number]>, pos: number, end: number): boolean {
  // returns true if [pos,end] fully inside an inserted range
  for (const [a, b] of ranges) {
    if (a <= pos && end <= b) return true;
    if (b < pos) continue;
    break;
  }
  return false;
}

/** Split [from,to] of a text node by inserted ranges into [text, isInserted] runs. */
function splitTextRuns(
  text: string,
  textStart: number,
  ranges: Array<[number, number]>,
): Array<{ text: string; inserted: boolean }> {
  const runs: Array<{ text: string; inserted: boolean }> = [];
  let cursor = textStart;
  const end = textStart + text.length;
  for (const [a, b] of ranges) {
    if (b <= cursor) continue;
    if (a >= end) break;
    const s = Math.max(a, cursor);
    const e = Math.min(b, end);
    if (s > cursor) runs.push({ text: text.slice(cursor - textStart, s - textStart), inserted: false });
    if (e > s) runs.push({ text: text.slice(s - textStart, e - textStart), inserted: true });
    cursor = e;
  }
  if (cursor < end) runs.push({ text: text.slice(cursor - textStart), inserted: false });
  return runs;
}

function serializeNode(
  schema: Schema,
  node: PMNode,
  pos: number,
  insertedRanges: Array<[number, number]>,
  deletionsByPos: Map<number, string>,
  out: string[],
): void {
  // Inject any pending deletions whose position equals current pos
  const pending = deletionsByPos.get(pos);
  if (pending) {
    out.push(`<del class="pm-del">${escapeHtml(pending)}</del>`);
    deletionsByPos.delete(pos);
  }
  if (node.isText) {
    const text = node.text ?? '';
    const runs = splitTextRuns(text, pos, insertedRanges);
    for (const run of runs) {
      const chunk = wrapMarks(escapeHtml(run.text), node.marks);
      out.push(run.inserted ? `<ins class="pm-ins">${chunk}</ins>` : chunk);
    }
    return;
  }
  if (node.isLeaf) {
    const leaf = LEAF_TAGS[node.type.name];
    const html = leaf ?? '';
    if (isInsertedAt(insertedRanges, pos, pos + node.nodeSize)) {
      out.push(`<ins class="pm-ins">${html}</ins>`);
    } else {
      out.push(html);
    }
    return;
  }
  const tag = BLOCK_TAGS[node.type.name];
  let open = '';
  let close = '';
  if (tag) {
    const t = tag(node);
    open = t.open;
    close = t.close;
  }
  const wholeInserted = isInsertedAt(insertedRanges, pos, pos + node.nodeSize);
  if (wholeInserted) out.push('<ins class="pm-ins-block">');
  out.push(open);
  if (node.type.name === 'codeBlock' || node.type.name === 'code_block') {
    out.push(escapeHtml(node.textContent));
  } else {
    let childPos = pos + 1;
    node.forEach((child) => {
      serializeNode(schema, child, childPos, insertedRanges, deletionsByPos, out);
      childPos += child.nodeSize;
    });
    // tail deletions at end of this block
    const trail = deletionsByPos.get(childPos);
    if (trail) {
      out.push(`<del class="pm-del">${escapeHtml(trail)}</del>`);
      deletionsByPos.delete(childPos);
    }
  }
  out.push(close);
  if (wholeInserted) out.push('</ins>');
}

function serializeDoc(
  schema: Schema,
  doc: PMNode,
  insertedRanges: Array<[number, number]>,
  deletionsByPos: Map<number, string>,
): string {
  const out: string[] = [];
  let pos = 0;
  doc.forEach((child) => {
    serializeNode(schema, child, pos, insertedRanges, deletionsByPos, out);
    pos += child.nodeSize;
  });
  // Anything left (e.g. trailing deletion after doc end)
  for (const [, txt] of deletionsByPos) {
    out.push(`<del class="pm-del">${escapeHtml(txt)}</del>`);
  }
  return out.join('');
}

function buildTextOps(
  changes: readonly { fromA: number; toA: number; fromB: number; toB: number }[],
  beforeDoc: PMNode,
  afterDoc: PMNode,
): DiffOp[] {
  const ops: DiffOp[] = [];
  let cursorB = 0;
  const push = (op: DiffOp) => {
    if (!op.text) return;
    const last = ops[ops.length - 1];
    if (last && last.type === op.type) last.text += op.text;
    else ops.push(op);
  };
  for (const ch of changes) {
    if (ch.fromB > cursorB) {
      push({ type: 'equal', text: afterDoc.textBetween(cursorB, ch.fromB, '\n', '\n') });
    }
    if (ch.toA > ch.fromA) {
      push({ type: 'delete', text: beforeDoc.textBetween(ch.fromA, ch.toA, '\n', '\n') });
    }
    if (ch.toB > ch.fromB) {
      push({ type: 'insert', text: afterDoc.textBetween(ch.fromB, ch.toB, '\n', '\n') });
    }
    cursorB = ch.toB;
  }
  if (cursorB < afterDoc.content.size) {
    push({ type: 'equal', text: afterDoc.textBetween(cursorB, afterDoc.content.size, '\n', '\n') });
  }
  return ops;
}

export function computeRichDiff(schema: Schema, beforeHtml: string, afterHtml: string): RichDiff {
  const beforeDoc = parseHTMLToDoc(schema, beforeHtml);
  const afterDoc = parseHTMLToDoc(schema, afterHtml);

  const tr = new Transform(beforeDoc);
  tr.replaceWith(0, beforeDoc.content.size, afterDoc.content as unknown as Fragment);

  let cs = ChangeSet.create(beforeDoc);
  cs = cs.addSteps(tr.doc, tr.mapping.maps, null);
  const simplified = simplifyChanges(cs.changes, tr.doc);

  const insertedRanges: Array<[number, number]> = [];
  const deletionsByPos = new Map<number, string>();
  for (const ch of simplified) {
    if (ch.toB > ch.fromB) insertedRanges.push([ch.fromB, ch.toB]);
    if (ch.toA > ch.fromA) {
      const txt = beforeDoc.textBetween(ch.fromA, ch.toA, ' ', ' ');
      if (txt) {
        const existing = deletionsByPos.get(ch.fromB) ?? '';
        deletionsByPos.set(ch.fromB, existing + (existing ? ' ' : '') + txt);
      }
    }
  }
  insertedRanges.sort((a, b) => a[0] - b[0]);

  const inlineHtml = serializeDoc(schema, afterDoc, insertedRanges, deletionsByPos);
  const ops = buildTextOps(simplified, beforeDoc, afterDoc);

  let ins = 0;
  let del = 0;
  for (const op of ops) {
    if (op.type === 'insert') ins += op.text.trim().split(/\s+/).filter(Boolean).length;
    else if (op.type === 'delete') del += op.text.trim().split(/\s+/).filter(Boolean).length;
  }
  return { ops, inlineHtml, stats: { ins, del, blocks: simplified.length } };
}

/** Convenience: extract HTML for a slice of an editor doc. */
export function sliceToHtml(schema: Schema, doc: PMNode, from: number, to: number): string {
  const slice = doc.slice(from, to);
  const serializer = DOMSerializer.fromSchema(schema);
  const div = document.createElement('div');
  div.appendChild(serializer.serializeFragment(slice.content));
  return div.innerHTML;
}
