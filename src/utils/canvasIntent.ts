/**
 * Detects when a user's chat prompt asks for the response to be placed in a canvas.
 * Mirrors ChatGPT's behaviour: phrases like "in a new canvas, write …" auto-open a canvas.
 */
const CANVAS_INTENT_PATTERNS: RegExp[] = [
  /\bin (?:a |the )?(?:new |fresh |blank )?canvas\b/i,
  /\b(?:as|into) (?:a |the )?(?:new )?canvas\b/i,
  /\b(?:create|open|make|start|use|put .* in)(?: a| the)? (?:new |blank )?canvas\b/i,
  /\bcanvas (?:this|that|it)\b/i,
];

export function detectCanvasIntent(text: string): boolean {
  if (!text) return false;
  return CANVAS_INTENT_PATTERNS.some((re) => re.test(text));
}
