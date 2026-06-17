import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AlignResponse, AlignSection } from "@/lib/align/types";

function rpc<T = unknown>(name: string, args: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>;
}

export interface RespondentBundle {
  respondent: { id: string; name: string | null; email: string | null; sections: AlignSection[] };
  session: { id: string; org_profile: Record<string, unknown>; status: string };
  responses: AlignResponse[];
}

export function useAlignRespondent(token: string | undefined) {
  const [bundle, setBundle] = useState<RespondentBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await rpc<RespondentBundle>("align_get_respondent", { _resp_token: t });
    setLoading(false);
    if (error) { setError(error.message); return null; }
    if (!data) { setError("Invite not found or revoked"); return null; }
    setBundle(data);
    return data;
  }, []);

  useEffect(() => { if (token) void load(token); }, [token, load]);

  const upsertResponse = useCallback(
    (section: AlignSection, question_key: string, answer_value: unknown, function_name: string | null = null) => {
      if (!token) return;
      const key = `${section}|${question_key}|${function_name ?? ""}`;
      setBundle((s) => {
        if (!s) return s;
        const others = s.responses.filter(
          (r) => !(r.section === section && r.question_key === question_key && (r.function_name ?? null) === function_name),
        );
        return { ...s, responses: [...others, { section, question_key, function_name, answer_value } as AlignResponse] };
      });
      const existing = saveTimers.current.get(key);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        void rpc<boolean>("align_upsert_respondent_response", {
          _resp_token: token,
          _section: section,
          _question_key: question_key,
          _answer_value: answer_value,
          _function_name: function_name,
        });
      }, 400);
      saveTimers.current.set(key, t);
    },
    [token],
  );

  const getAnswer = useCallback(
    (section: AlignSection, question_key: string, function_name: string | null = null) =>
      bundle?.responses.find(
        (r) => r.section === section && r.question_key === question_key && (r.function_name ?? null) === function_name,
      )?.answer_value,
    [bundle],
  );

  return { bundle, loading, error, upsertResponse, getAnswer, reload: () => (token ? load(token) : Promise.resolve(null)) };
}