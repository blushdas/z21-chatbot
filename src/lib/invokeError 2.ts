/**
 * Surface real status codes + response bodies when supabase.functions.invoke
 * fails. supabase-js wraps any non-2xx (and network errors) into a generic
 * FunctionsHttpError / FunctionsFetchError whose .message is just
 * "Edge Function returned a non-2xx status code" or "Failed to send a request
 * to the Edge Function". We re-read the underlying Response so the user
 * actually sees the status + error JSON.
 */
export async function describeInvokeError(err: any, fnName: string): Promise<string> {
  if (!err) return `${fnName}: unknown error`;
  const resp: Response | undefined = err?.context instanceof Response ? err.context : undefined;
  if (resp) {
    let body = "";
    try { body = await resp.clone().text(); } catch { /* noop */ }
    let parsed: any = null;
    try { parsed = body ? JSON.parse(body) : null; } catch { /* noop */ }
    const detail =
      parsed?.error ||
      parsed?.message ||
      (typeof parsed?.details === "string" ? parsed.details : null) ||
      body ||
      resp.statusText;
    return `${fnName} (${resp.status}): ${detail || "no details"}`;
  }
  const msg = err?.message || String(err);
  // Filter out the most useless supabase-js stock messages.
  if (/non-2xx status code|Failed to send a request/i.test(msg)) {
    return `${fnName}: request failed (no response body)`;
  }
  return `${fnName}: ${msg}`;
}

/** Convenience: returns just the inner detail (no function name prefix). */
export async function extractInvokeError(err: any): Promise<string> {
  const full = await describeInvokeError(err, "");
  return full.replace(/^\s*\(?\d*\)?:?\s*/, "").trim() || "Unknown error";
}
