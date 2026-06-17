import { describe, it, expect, vi, beforeEach } from "vitest";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: invokeMock } },
}));

import { sendPineconeChatMessage } from "@/api/pineconeChat";

/**
 * End-to-end contract test for the "No Blueprints" response mode.
 *
 * Verifies the boundary between the client (PromptModifiers → useChatHandlers →
 * sendPineconeChatMessage) and the `pinecone-rag-chat` edge function:
 *
 *  1. Outgoing body carries `skipPrompts: true` whenever the user has selected
 *     "No Blueprints" — for both KB enabled and KB disabled.
 *  2. Function name + non-streaming flag are correct.
 *  3. Whatever raw text the edge function returns is passed back untouched.
 */
describe("No Blueprints — request contract", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("sends skipPrompts=true and returns raw model output when KB is ENABLED", async () => {
    const rawOutput =
      "The capital of France is Paris. (Raw model response — no Daryle persona.)";
    invokeMock.mockResolvedValueOnce({ data: { response: rawOutput }, error: null });

    const result = await sendPineconeChatMessage({
      message: "What is the capital of France?",
      mode: "coach",
      length: "medium",
      subPrompts: ["noBlueprints"],
      responseMode: "no_blueprints",
      modelOverride: "grounded",
      skipPrompts: true,
      rawModelOnly: false,
      skipRAG: false, // KB enabled
    });

    expect(invokeMock).toHaveBeenCalledTimes(1);
    const [fnName, opts] = invokeMock.mock.calls[0];
    expect(fnName).toBe("pinecone-rag-chat");
    expect(opts.body).toMatchObject({
      subPrompts: ["noBlueprints"],
      responseMode: "no_blueprints",
      skipPrompts: true,
      rawModelOnly: false,
      skipRAG: false,
      streaming: false,
    });
    expect(result.response).toBe(rawOutput);
  });

  it("sends skipPrompts=true and returns raw model output when KB is DISABLED", async () => {
    const rawOutput = "2 + 2 = 4. (Raw model output, no KB, no persona.)";
    invokeMock.mockResolvedValueOnce({ data: { response: rawOutput }, error: null });

    const result = await sendPineconeChatMessage({
      message: "What is 2 + 2?",
      mode: "coach",
      length: "medium",
      subPrompts: ["noBlueprints"],
      responseMode: "no_blueprints",
      modelOverride: "grounded",
      skipPrompts: true,
      rawModelOnly: true,
      skipRAG: true, // KB disabled
    });

    expect(invokeMock).toHaveBeenCalledTimes(1);
    const [, opts] = invokeMock.mock.calls[0];
    expect(opts.body).toMatchObject({
      subPrompts: ["noBlueprints"],
      responseMode: "no_blueprints",
      skipPrompts: true,
      rawModelOnly: true,
      skipRAG: true,
      streaming: false,
    });
    expect(result.response).toBe(rawOutput);
  });

  it("does NOT send skipPrompts when Standard mode is selected", async () => {
    invokeMock.mockResolvedValueOnce({
      data: { response: "Standard Daryle reply." },
      error: null,
    });
    await sendPineconeChatMessage({
      message: "hello",
      mode: "coach",
      length: "medium",
      subPrompts: ["standard"],
      responseMode: "standard",
      modelOverride: "grounded",
      skipRAG: false,
    });
    const [, opts] = invokeMock.mock.calls[0];
    expect(opts.body.skipPrompts).not.toBe(true);
    expect(opts.body.subPrompts).toEqual(["standard"]);
  });

  it("surfaces edge-function errors instead of swallowing them", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(
      sendPineconeChatMessage({
        message: "x",
        mode: "coach",
        length: "medium",
        subPrompts: ["noBlueprints"],
        skipPrompts: true,
      }),
    ).rejects.toThrow(/boom/);
  });
});