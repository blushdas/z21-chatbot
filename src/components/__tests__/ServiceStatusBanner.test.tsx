import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ServiceStatusBanner } from '../ServiceStatusBanner';

vi.mock('@/context/SupabaseHealthContext', () => ({
  useSupabaseHealthOptional: () => ({
    isOffline: true,
    isDegraded: false,
    reconnecting: false,
    isOnline: false,
    syncProgress: 0,
  }),
}));

describe('ServiceStatusBanner layout contract', () => {
  it('renders in normal document flow (never fixed/absolute)', () => {
    const { getByTestId } = render(<ServiceStatusBanner />);
    const el = getByTestId('service-status-banner');
    const cls = el.className;
    expect(cls).not.toMatch(/\bfixed\b/);
    expect(cls).not.toMatch(/\babsolute\b/);
    // Guard against high z-index that would overlay page headers.
    expect(cls).not.toMatch(/z-\[(?:100|[1-9]\d{2,})\]/);
    expect(cls).not.toMatch(/\bz-(?:50|[6-9]\d|\d{3,})\b/);
  });
});
