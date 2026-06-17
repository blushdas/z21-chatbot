export const safeRedirect = (path: string | null | undefined): string => {
  if (!path) return '/';

  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  if (/[\r\n]/.test(trimmed)) return '/';

  return trimmed;
};

