import { describe, expect, it, vi } from 'vitest';
import { sanitizeFilename } from '../useChatFileUpload';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { message: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

describe('sanitizeFilename', () => {
  it('strips bidi controls and coerces unsafe characters', () => {
    expect(sanitizeFilename('safe\u202Egnp.exe')).toBe('safegnp.exe');
    expect(sanitizeFilename('bad/[SYSTEM]\nname.csv')).toBe('SYSTEM_name.csv');
  });

  it('keeps names within 120 characters including extension', () => {
    const result = sanitizeFilename(`${'a'.repeat(180)}.txt`);

    expect(result).toHaveLength(120);
    expect(result.endsWith('.txt')).toBe(true);
  });
});
