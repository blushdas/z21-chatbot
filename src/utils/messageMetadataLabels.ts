/**
 * Centralized mode and model label mappings for consistent display across the UI
 */

// Mode mappings (from PromptModifiers.tsx / ModeChangeDivider.tsx)
export const modeLabelMap: Record<string, string> = {
  standard: "Wisdom Mode",
  quickAnswer: "Standard Mode",
  quickanswer: "Standard Mode",
  directQuotes: "Direct Quotes",
  directquotes: "Direct Quotes",
  storytelling: "Storytelling",
  noBlueprints: "No Blueprints",
  noblueprints: "No Blueprints",
  no_blueprints: "No Blueprints",
  coach: "Wisdom Mode", // Legacy mode name
  founderVoiceAlanPlatt: "Founder Voice: Alan Platt",
};

// Model mappings (from ModelSwitcher.tsx / ModelChangeDivider.tsx)
export const modelLabelMap: Record<string, string> = {
  grounded: "Instant",
  fast: "Thinking",
  deep: "Pro",
  auto: "Auto",
  instant: "Instant",
  thinking: "Thinking",
  pro: "Pro",
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  'chatgpt-claude': "Structure + Polish",
  'gpt-5.4-mini': "ChatGPT Instant",
  'gpt-5.4-nano': "ChatGPT Instant",
  'gpt-5.5': "ChatGPT Thinking",
  'gpt-5.5-pro': "ChatGPT Pro",
  'claude-haiku-4-5': "Claude Instant",
  'claude-sonnet-4-6': "Claude Thinking",
  'claude-opus-4-7': "Claude Pro",
  'gemini-3.1-flash': "Gemini Instant",
  'gemini-3.1-flash-lite': "Gemini Instant",
  'gemini-3.1-pro-preview': "Gemini Pro",
};

// Processing power mappings (Instant / Thinking / Pro tier)
export const powerLabelMap: Record<string, string> = {
  instant: "Instant",
  thinking: "Thinking",
  pro: "Pro",
};

export const getPowerLabel = (power?: string): string | null => {
  if (!power) return null;
  const key = power.trim().toLowerCase();
  return powerLabelMap[key] || null;
};

/**
 * Get human-readable mode label
 */
export const getModeLabel = (mode?: string): string => {
  if (!mode) return "Wisdom Mode";
  const key = mode.trim();
  return modeLabelMap[key] || modeLabelMap[key.toLowerCase()] || key;
};

/**
 * Get human-readable model label
 */
export const getModelLabel = (model?: string): string => {
  if (!model) return "Auto";
  const key = model.trim();
  return modelLabelMap[key] || modelLabelMap[key.toLowerCase()] || key;
};

/**
 * Format as "via Wisdom Mode • Gemini".
 * Only shows Knowledge Base state when disabled, to avoid clutter.
 */
export const formatMessageMetadata = (
  mode?: string,
  model?: string,
  knowledgeBaseEnabled?: boolean,
  processingPower?: string,
): string => {
  const modeLabel = getModeLabel(mode);
  const modelLabel = getModelLabel(model);
  const powerLabel = getPowerLabel(processingPower);
  const knowledgeLabel = knowledgeBaseEnabled === false ? " • Knowledge Base off" : "";
  // Only append power when it adds info beyond the model label (e.g. brand-pinned: "Claude • Pro").
  // For Auto routing, modelLabel is already Instant/Thinking/Pro, so skip duplication.
  const powerSuffix =
    powerLabel && powerLabel.toLowerCase() !== modelLabel.toLowerCase()
      ? ` • ${powerLabel}`
      : '';
  return `via ${modeLabel} • ${modelLabel}${powerSuffix}${knowledgeLabel}`;
};
