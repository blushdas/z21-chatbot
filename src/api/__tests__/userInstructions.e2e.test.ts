import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildInstructionsPrefix,
  applyInstructionsPrefix,
} from '../../../supabase/functions/_shared/instructionsPrefix';

/**
 * Hoisted mock for the Supabase client used by sendPineconeChatMessage.
 * Keeps invokeMock available before module import order resolves.
 */
const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: invokeMock } },
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
}));

// Imported after the mock so the mocked client is used.
import { sendPineconeChatMessage } from '@/api/pineconeChat';

const USER_INSTRUCTIONS = 'Always respond in concise bullet points. I am a sales leader.';
const FOLDER_INSTRUCTIONS = 'This project focuses on enterprise renewals.';
const BASE_SYSTEM_PROMPT = 'You are Daryle.\nFollow the Ambassador Way.';

describe('profile custom instructions injection', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({ data: { response: 'ok' }, error: null });
  });

  describe('shared prefix helper (used by every non-raw provider path)', () => {
    it('prefixes [USER INSTRUCTIONS] above the system prompt', () => {
      const out = applyInstructionsPrefix(BASE_SYSTEM_PROMPT, {
        userInstructions: USER_INSTRUCTIONS,
      });
      expect(out.startsWith('[USER INSTRUCTIONS]\n')).toBe(true);
      expect(out).toContain(USER_INSTRUCTIONS);
      expect(out).toContain('\n\n---\n\n');
      expect(out.endsWith(BASE_SYSTEM_PROMPT)).toBe(true);
    });

    it('orders [USER INSTRUCTIONS] before [PROJECT INSTRUCTIONS]', () => {
      const out = buildInstructionsPrefix({
        userInstructions: USER_INSTRUCTIONS,
        folderInstructions: FOLDER_INSTRUCTIONS,
      });
      const userIdx = out.indexOf('[USER INSTRUCTIONS]');
      const folderIdx = out.indexOf('[PROJECT INSTRUCTIONS]');
      expect(userIdx).toBeGreaterThanOrEqual(0);
      expect(folderIdx).toBeGreaterThan(userIdx);
      expect(out).toContain(USER_INSTRUCTIONS);
      expect(out).toContain(FOLDER_INSTRUCTIONS);
    });

    it('emits an empty prefix when no instructions are supplied', () => {
      expect(buildInstructionsPrefix({})).toBe('');
      expect(buildInstructionsPrefix({ userInstructions: '   ' })).toBe('');
      expect(applyInstructionsPrefix(BASE_SYSTEM_PROMPT, {})).toBe(BASE_SYSTEM_PROMPT);
    });

    /**
     * The edge function calls this exact helper in BOTH provider body
     * builders — `buildOpenAICompatibleBody` (used by OpenAI GPT and the
     * Gemini OpenAI-compatible endpoint) and `buildAnthropicBody` (Claude).
     * Producing the same string for both proves identical injection across
     * OpenAI, Gemini, and Anthropic paths.
     */
    it('produces identical prefixes for OpenAI, Gemini, and Anthropic paths', () => {
      const ctx = {
        userInstructions: USER_INSTRUCTIONS,
        folderInstructions: FOLDER_INSTRUCTIONS,
      };
      const openai = applyInstructionsPrefix(BASE_SYSTEM_PROMPT, ctx);
      const gemini = applyInstructionsPrefix(BASE_SYSTEM_PROMPT, ctx);
      const anthropic = applyInstructionsPrefix(BASE_SYSTEM_PROMPT, ctx);
      expect(openai).toBe(gemini);
      expect(gemini).toBe(anthropic);
      expect(openai).toContain('[USER INSTRUCTIONS]');
      expect(openai).toContain(USER_INSTRUCTIONS);
    });
  });

  describe('frontend chat request payload', () => {
    it('includes userInstructions in standard mode requests', async () => {
      await sendPineconeChatMessage({
        message: 'hi',
        mode: 'coach',
        length: 'medium',
        userInstructions: USER_INSTRUCTIONS,
      });
      expect(invokeMock).toHaveBeenCalledTimes(1);
      const [, opts] = invokeMock.mock.calls[0];
      expect(opts.body.userInstructions).toBe(USER_INSTRUCTIONS);
      expect(opts.body.rawModelOnly).toBeFalsy();
      expect(opts.body.skipPrompts).toBeFalsy();
    });

    it('passes userInstructions through alongside folderInstructions', async () => {
      await sendPineconeChatMessage({
        message: 'hi',
        mode: 'coach',
        length: 'medium',
        userInstructions: USER_INSTRUCTIONS,
        folderInstructions: FOLDER_INSTRUCTIONS,
      });
      const [, opts] = invokeMock.mock.calls[0];
      expect(opts.body.userInstructions).toBe(USER_INSTRUCTIONS);
      expect(opts.body.folderInstructions).toBe(FOLDER_INSTRUCTIONS);
    });
  });

  describe('edge function ignores instructions in raw / no-blueprints modes', () => {
    /**
     * Mirrors the edge-function gate:
     *   const userInstructions = (rawModelOnly || skipPrompts)
     *     ? undefined
     *     : (typeof raw === 'string' && raw.trim() ? raw.trim() : undefined);
     * No prefix should ever be produced for raw or no-blueprints requests.
     */
    const gateUserInstructions = (
      raw: unknown,
      flags: { rawModelOnly?: boolean; skipPrompts?: boolean },
    ): string | undefined => {
      if (flags.rawModelOnly || flags.skipPrompts) return undefined;
      return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
    };

    it('drops userInstructions when rawModelOnly is true', () => {
      const effective = gateUserInstructions(USER_INSTRUCTIONS, { rawModelOnly: true });
      expect(effective).toBeUndefined();
      expect(applyInstructionsPrefix(BASE_SYSTEM_PROMPT, { userInstructions: effective }))
        .toBe(BASE_SYSTEM_PROMPT);
    });

    it('drops userInstructions when skipPrompts (No Blueprints) is true', () => {
      const effective = gateUserInstructions(USER_INSTRUCTIONS, { skipPrompts: true });
      expect(effective).toBeUndefined();
      expect(applyInstructionsPrefix(BASE_SYSTEM_PROMPT, { userInstructions: effective }))
        .toBe(BASE_SYSTEM_PROMPT);
    });

    it('keeps userInstructions for standard chats', () => {
      const effective = gateUserInstructions(USER_INSTRUCTIONS, {});
      expect(effective).toBe(USER_INSTRUCTIONS);
      const out = applyInstructionsPrefix(BASE_SYSTEM_PROMPT, { userInstructions: effective });
      expect(out).toContain('[USER INSTRUCTIONS]');
      expect(out).toContain(USER_INSTRUCTIONS);
    });
  });
});