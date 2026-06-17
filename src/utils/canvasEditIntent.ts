/**
 * Detect whether a chat message (while a canvas is open) is asking to MODIFY
 * the open canvas, as opposed to asking a normal question.
 */
const EDIT_VERB = /\b(rewrite|edit|update|revise|change|modify|add|append|insert|prepend|include|remove|delete|drop|replace|swap|shorten|tighten|expand|extend|lengthen|summari[sz]e|condense|reword|rephrase|polish|improve|fix|clean(?:\s*up)?|turn\s+(?:it|this)\s+into|make\s+(?:it|this|the))\b/i;
const CANVAS_TARGET = /\b(canvas|doc(?:ument)?|draft|page|file|section|heading|paragraph|intro(?:duction)?|conclusion|outline|bullet(?:s|\s*list)?|list|table|title)\b/i;
const DIRECT_REF = /\b(in|to|on|inside|into)\s+the\s+(canvas|doc(?:ument)?|draft)\b/i;
const EXPLICIT_CANVAS_WORD = /\b(canvas|doc(?:ument)?|draft)\b/i;

export function detectCanvasEditIntent(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 3) return false;
  if (DIRECT_REF.test(t)) return true;
  return EDIT_VERB.test(t) && CANVAS_TARGET.test(t);
}

/**
 * Stricter check used when NO canvas is currently open. The user must
 * explicitly mention the canvas/doc/draft for us to re-open it and route
 * the message through the canvas edit flow. Otherwise it's a normal chat.
 */
export function detectExplicitCanvasReference(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 3) return false;
  if (!EXPLICIT_CANVAS_WORD.test(t)) return false;
  return EDIT_VERB.test(t) || DIRECT_REF.test(t);
}
