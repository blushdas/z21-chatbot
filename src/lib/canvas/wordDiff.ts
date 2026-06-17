// Lightweight word-level diff using LCS. Returns ordered ops for rendering.
export type DiffOp =
  | { type: 'equal'; text: string }
  | { type: 'insert'; text: string }
  | { type: 'delete'; text: string };

function tokenize(s: string): string[] {
  // Keep whitespace as its own tokens so spacing survives reassembly.
  return s.match(/\s+|[^\s]+/g) ?? [];
}

export function diffWords(before: string, after: string): DiffOp[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  // Build LCS table (O(n*m) — fine for canvas-sized text up to ~80k chars).
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  const push = (op: DiffOp) => {
    const last = ops[ops.length - 1];
    if (last && last.type === op.type) last.text += op.text;
    else ops.push(op);
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push({ type: 'equal', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push({ type: 'delete', text: a[i] });
      i++;
    } else {
      push({ type: 'insert', text: b[j] });
      j++;
    }
  }
  while (i < n) { push({ type: 'delete', text: a[i++] }); }
  while (j < m) { push({ type: 'insert', text: b[j++] }); }
  return ops;
}

/** Strip HTML to plain text using the browser parser. */
export function htmlToPlain(html: string): string {
  if (typeof window === 'undefined') return html.replace(/<[^>]+>/g, '');
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent ?? '').replace(/\u00a0/g, ' ');
}