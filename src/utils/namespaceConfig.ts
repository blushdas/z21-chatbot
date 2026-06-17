// Canonical namespace → display label mapping
// SINGLE SOURCE OF TRUTH for namespace labeling across the entire application

export const NAMESPACE_CONFIG = {
  'Daryle-Project-Smart-Articles': {
    label: 'Project SMART Article',
    sourceType: 'project_smart_article',
    vectorCount: 7920
  },
  'Daryle-Learning-Time-Transcripts': {
    label: 'Learning Time Transcript', 
    sourceType: 'learning_time_transcript',
    vectorCount: 12819
  },
  'Daryle-Folders': {
    label: "Daryle's Archives",
    sourceType: 'daryle_archives',
    vectorCount: 3304
  }
} as const;

export type NamespaceKey = keyof typeof NAMESPACE_CONFIG;

/**
 * Get display label for a namespace based on source_type or namespace name
 * @param namespace - The Pinecone namespace
 * @param sourceType - The source_type metadata field (more reliable)
 * @returns Display label or 'Unknown' if not found
 */
export function getDisplayLabel(namespace: string, sourceType?: string): string {
  // Check source_type first (most reliable from backend)
  for (const [ns, config] of Object.entries(NAMESPACE_CONFIG)) {
    if (sourceType === config.sourceType) return config.label;
  }
  
  // Then check namespace directly
  if (namespace in NAMESPACE_CONFIG) {
    return NAMESPACE_CONFIG[namespace as NamespaceKey].label;
  }
  
  // Fallback to 'Unknown'
  return 'Unknown';
}

/**
 * Get color classes for a media type badge
 * @param mediaType - The media type/namespace label
 * @returns Tailwind CSS classes for the badge
 */
export function getMediaTypeColor(mediaType: string): string {
  const normalized = mediaType.toLowerCase();
  
  if (normalized.includes('project smart')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30';
  }
  if (normalized.includes('learning time') || normalized.includes('transcript')) {
    return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30';
  }
  if (normalized.includes('archives')) {
    return 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/30';
  }
  // Default fallback
  return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-primary/15 dark:text-primary-foreground dark:border-primary/30';
}
