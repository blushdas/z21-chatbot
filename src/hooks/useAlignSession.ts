import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AlignResponse, AlignSection, AlignSession, OrgProfile } from "@/lib/align/types";

const LS_TOKEN_KEY = "align:lastToken";

function rpc<T = unknown>(name: string, args: Record<string, unknown>) {
  // typed any to avoid stale supabase types until codegen catches up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>;
}

export function useAlignSession(tokenFromUrl?: string) {
  const [token, setToken] = useState<string | null>(tokenFromUrl ?? null);
  const [session, setSession] = useState<AlignSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await rpc<AlignSession>("align_get_session", { _token: t });
    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    if (!data) {
      setError("Session not found");
      return null;
    }
    setSession(data);
    return data;
  }, []);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      void load(tokenFromUrl);
    } else {
      const stored = typeof window !== "undefined" ? localStorage.getItem(LS_TOKEN_KEY) : null;
      if (stored) {
        setToken(stored);
        void load(stored);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  const create = useCallback(async (org: OrgProfile) => {
    setLoading(true);
    setError(null);
    const { data, error } = await rpc<Array<{ id: string; token: string }>>("align_create_session", {
      _org_profile: org,
    });
    setLoading(false);
    if (error || !data || data.length === 0) {
      setError(error?.message ?? "Failed to create session");
      return null;
    }
    const created = data[0];
    localStorage.setItem(LS_TOKEN_KEY, created.token);
    setToken(created.token);
    await load(created.token);
    return created.token;
  }, [load]);

  const updateProfile = useCallback(async (org: OrgProfile) => {
    if (!token) return false;
    const { error } = await rpc<boolean>("align_update_profile", { _token: token, _org_profile: org });
    if (!error) setSession((s) => (s ? { ...s, org_profile: org } : s));
    return !error;
  }, [token]);

  const upsertResponse = useCallback(
    (section: AlignSection, question_key: string, answer_value: unknown, function_name: string | null = null) => {
      if (!token) return;
      const key = `${section}|${question_key}|${function_name ?? ""}`;
      // optimistic local update
      setSession((s) => {
        if (!s) return s;
        const others = s.responses.filter(
          (r) => !(r.section === section && r.question_key === question_key && (r.function_name ?? null) === function_name),
        );
        return {
          ...s,
          responses: [...others, { section, question_key, function_name, answer_value } as AlignResponse],
        };
      });
      // debounce save
      const existing = saveTimers.current.get(key);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        void rpc<boolean>("align_upsert_response", {
          _token: token,
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

  const setEmail = useCallback(async (email: string) => {
    if (!token) return false;
    const { error } = await rpc<boolean>("align_set_email", { _token: token, _email: email });
    if (!error) setSession((s) => (s ? { ...s, email } : s));
    return !error;
  }, [token]);

  const saveReport = useCallback(async (report: unknown) => {
    if (!token) return false;
    const { error } = await rpc<boolean>("align_save_report", { _token: token, _report: report });
    return !error;
  }, [token]);

  // helper: get answer by key
  const getAnswer = useCallback(
    (section: AlignSection, question_key: string, function_name: string | null = null) => {
      return session?.responses.find(
        (r) => r.section === section && r.question_key === question_key && (r.function_name ?? null) === function_name,
      )?.answer_value;
    },
    [session],
  );

  return {
    token,
    session,
    loading,
    error,
    create,
    updateProfile,
    upsertResponse,
    setEmail,
    saveReport,
    getAnswer,
    reload: () => (token ? load(token) : Promise.resolve(null)),
  };
}