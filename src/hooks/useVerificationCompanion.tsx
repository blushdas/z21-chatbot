import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MessageType } from '@/components/ChatInterface';

export interface VerificationResult {
  whatSeemssolid: string;
  whatToQuestion: string;
  whatToVerify: string;
  companionPerspective: string;
}

const VERIFICATION_SYSTEM_PROMPT = `You are a Third-Party Verification Companion — a calm, wise, analytical advisor who reviews AI assistant responses to help users think critically.

Your role: observe, assess, and provide a second perspective on the main assistant's response. You are NOT a replacement — you are a thoughtful verifier.

Tone: wise, calm, helpful, slightly supervisory. Like an intelligent mentor helping someone make better decisions.

ALWAYS structure your response in EXACTLY these four sections using these exact headers:

## What Seems Solid
Summarize what appears reasonable, well-grounded, and internally consistent in the main response. Highlight strengths.

## What to Question
Identify potential assumptions, weak points, unclear logic, or areas of overconfidence. Be constructive, not combative.

## What to Verify
List specific facts, claims, or references the user should independently double-check. Be specific.

## Companion Perspective
Provide a short, thoughtful takeaway to guide decision-making. Reinforce good reasoning and encourage discernment.

RULES:
- Be concise — each section should be 1-3 sentences.
- Do NOT contradict unnecessarily.
- Validate when appropriate, challenge when necessary.
- If the response looks strong, say so clearly.
- Never repeat the original response verbatim.`;

export function useVerificationCompanion(lastAssistantMessage: MessageType | null) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedId = useRef<string | null>(null);
  const lastMessageRef = useRef<MessageType | null>(null);

  const analyze = useCallback(async (msg: MessageType) => {
    console.log('[VerificationCompanion] 🔍 Starting analysis, content length:', msg.content.length);
    setLoading(true);
    setError(null);

    try {
      await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const verificationPrompt = `You are acting as a Third-Party Verification Companion. Your job is to analyze the following AI assistant response and provide a structured review. Use EXACTLY these four section headers in your response:

## What Seems Solid
## What to Question  
## What to Verify
## Companion Perspective

Keep each section to 1-3 sentences. Be constructive, not combative. Validate when appropriate, challenge when necessary.

Here is the AI assistant response to analyze:

---
${msg.content}
---

Provide your structured verification review now.`;

      const { data, error: fnError } = await supabase.functions.invoke('pinecone-rag-chat', {
        body: {
          message: verificationPrompt,
          mode: 'coach',
          length: 'medium',
          responseMode: 'coaching',
          streaming: false,
          subPrompts: ['quickAnswer'],
        },
      });

      if (fnError) {
        const { describeInvokeError } = await import('@/lib/invokeError');
        const msg = await describeInvokeError(fnError, 'pinecone-rag-chat');
        console.error('[VerificationCompanion] ❌ Edge function error:', msg);
        throw new Error(msg);
      }

      console.log('[VerificationCompanion] ✅ Got response, length:', (data?.response || '').length);
      const responseText: string = data?.response || '';
      const parsed = parseVerificationResponse(responseText);
      setResult(parsed);
    } catch (err: any) {
      console.error('[VerificationCompanion] ❌ Error:', err);
      setError(err.message || 'Verification failed');
      setResult(getMockResult(msg.content));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lastAssistantMessage) {
      console.log('[VerificationCompanion] No lastAssistantMessage yet');
      return;
    }
    if (lastAssistantMessage.sender !== 'daryle') {
      console.log('[VerificationCompanion] Skipping non-daryle message:', lastAssistantMessage.sender);
      return;
    }
    if (lastAssistantMessage.id === lastProcessedId.current) {
      console.log('[VerificationCompanion] Already processed:', lastAssistantMessage.id);
      return;
    }

    console.log('[VerificationCompanion] ✅ Triggering analysis for message:', lastAssistantMessage.id);
    lastProcessedId.current = lastAssistantMessage.id;
    lastMessageRef.current = lastAssistantMessage;
    analyze(lastAssistantMessage);
  }, [lastAssistantMessage, analyze]);

  const reVerify = useCallback(() => {
    if (lastMessageRef.current) {
      analyze(lastMessageRef.current);
    }
  }, [analyze]);

  return { result, loading, error, reVerify };
}

function parseVerificationResponse(text: string): VerificationResult {
  const sections = {
    whatSeemssolid: '',
    whatToQuestion: '',
    whatToVerify: '',
    companionPerspective: '',
  };

  const solidMatch = text.match(/## What Seems Solid\s*\n([\s\S]*?)(?=## What to Question|$)/i);
  const questionMatch = text.match(/## What to Question\s*\n([\s\S]*?)(?=## What to Verify|$)/i);
  const verifyMatch = text.match(/## What to Verify\s*\n([\s\S]*?)(?=## Companion Perspective|$)/i);
  const perspectiveMatch = text.match(/## Companion Perspective\s*\n([\s\S]*?)$/i);

  sections.whatSeemssolid = solidMatch?.[1]?.trim() || 'Analysis pending.';
  sections.whatToQuestion = questionMatch?.[1]?.trim() || 'No concerns identified.';
  sections.whatToVerify = verifyMatch?.[1]?.trim() || 'No specific claims to verify.';
  sections.companionPerspective = perspectiveMatch?.[1]?.trim() || 'Response appears reasonable.';

  return sections;
}

function getMockResult(content: string): VerificationResult {
  const wordCount = content.split(/\s+/).length;
  return {
    whatSeemssolid: `The response is ${wordCount > 100 ? 'comprehensive' : 'concise'} and addresses the question directly. The structure and tone appear appropriate.`,
    whatToQuestion: wordCount > 200
      ? 'The length of the response may indicate over-explanation. Consider whether all points are necessary.'
      : 'No major concerns identified in this response.',
    whatToVerify: 'Any specific dates, statistics, or named references should be independently confirmed.',
    companionPerspective: 'This response appears reasonable overall. Use your own judgment alongside this guidance.',
  };
}
