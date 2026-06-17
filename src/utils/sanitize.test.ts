import { describe, expect, it } from 'vitest';
import { sanitizeMarkdown } from './sanitize';

describe('sanitizeMarkdown', () => {
  it('strips executable HTML from rendered markdown content', () => {
    const unsafe = '<p>Hello</p><img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a>';

    const sanitized = sanitizeMarkdown(unsafe);

    expect(sanitized).toContain('<p>Hello</p>');
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('javascript:');
  });
});
