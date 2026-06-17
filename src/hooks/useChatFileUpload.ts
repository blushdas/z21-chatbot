import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

export type ChatAttachment = {
  documentId: string;
  fileName: string;
  mimeType: string;
  fileType: "pdf" | "docx" | "txt" | "md" | "rtf" | "csv" | "xlsx" | "jpg" | "jpeg" | "png" | "webp" | "gif";
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  error?: string;
  active: boolean;
  storagePath?: string;
  parsedText?: string;
  pageCount?: number;
  /** Base64 data URL for image attachments (client-side only, not persisted to DB). */
  imageBase64?: string;
  /** Persistence state of parsed_text into chat_attachments table. */
  persistStatus?: "pending" | "saved" | "failed" | "skipped";
  persistError?: string;
  persistedRowId?: string;
  /** Original File kept for retry. */
  file?: File;
};

const MAX_FILES = 20;
// Per-type upload size limits — mirrors what the backend can reasonably parse.
const PER_TYPE_LIMITS: Record<string, number> = {
  pdf:      25 * 1024 * 1024,
  docx:     20 * 1024 * 1024,
  doc:      20 * 1024 * 1024,
  xlsx:     10 * 1024 * 1024,
  xls:      10 * 1024 * 1024,
  csv:      10 * 1024 * 1024,
  txt:      10 * 1024 * 1024,
  md:       10 * 1024 * 1024,
  markdown: 10 * 1024 * 1024,
  rtf:      10 * 1024 * 1024,
  jpg:       5 * 1024 * 1024,
  jpeg:      5 * 1024 * 1024,
  png:       5 * 1024 * 1024,
  webp:      5 * 1024 * 1024,
  gif:       5 * 1024 * 1024,
};
const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED = new Set([
  "pdf", "docx", "txt", "md", "markdown", "rtf", "csv", "xlsx",
  "jpg", "jpeg", "png", "webp", "gif",
]);
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const MAX_NAME_LENGTH = 120;
export function sanitizeFilename(raw: string): string {
  let name = (raw ?? "").toString();
  name = name.split(/[\\/]/).pop() ?? "";
  try { name = name.normalize("NFC"); } catch { /* noop */ }
  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\x00-\x1f\x7f]/g, "");
  name = name.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
  name = name.replace(/[<>:"|?*\x60]/g, "");
  name = name.replace(/\s+/g, " ").trim();
  name = name.replace(/^[.\s]+/, "");
  name = name.replace(/\.{2,}/g, ".");
  if (!name) name = "file";
  const lastDot = name.lastIndexOf(".");
  let base = lastDot > 0 ? name.slice(0, lastDot) : name;
  let ext = lastDot > 0 ? name.slice(lastDot + 1) : "";
  ext = ext.replace(/[^A-Za-z0-9]/g, "").toLowerCase().slice(0, 10);
  base = base.replace(/[/\\]/g, "_").trim();
  base = base.replace(/[^a-zA-Z0-9._\-() À-ɏ]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").trim();
  if (!base) base = "file";
  const room = MAX_NAME_LENGTH - (ext ? ext.length + 1 : 0);
  if (base.length > room) base = base.slice(0, room).trim();
  return ext ? `${base}.${ext}` : base;
}

function withSanitizedName(file: File): { file: File; changed: boolean } {
  const clean = sanitizeFilename(file.name);
  if (clean === file.name) return { file, changed: false };
  try {
    return { file: new File([file], clean, { type: file.type, lastModified: file.lastModified }), changed: true };
  } catch {
    return { file, changed: false };
  }
}

function detectType(name: string): ChatAttachment["fileType"] | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "xlsx") return "xlsx";
  if (ext === "csv") return "csv";
  if (ext === "txt") return "txt";
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "rtf") return "rtf";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  if (ext === "gif") return "gif";
  return null;
}

function validateFile(file: File): string | null {
  if (file.size < 1) return "File is empty.";
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!ALLOWED.has(ext)) return "Unsupported type. Use PDF, DOCX, TXT, MD, RTF, CSV, XLSX, or an image (JPG, PNG, WEBP, GIF).";
  const limit = PER_TYPE_LIMITS[ext] ?? DEFAULT_MAX_FILE_SIZE;
  if (file.size > limit) return `File exceeds ${Math.round(limit / 1024 / 1024)} MB limit for .${ext} files.`;
  return null;
}

function mimeForUpload(file: File, fileType: ChatAttachment["fileType"]): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const fallback: Record<ChatAttachment["fileType"], string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    md: "text/markdown",
    rtf: "application/rtf",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return fallback[fileType] ?? "application/octet-stream";
}

function normalizeDataUrlMime(dataUrl: string, mimeType: string): string {
  if (!mimeType.startsWith("image/")) return dataUrl;
  return dataUrl.replace(/^data:[^;]*;base64,/, `data:${mimeType};base64,`);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

export function useChatFileUpload(
  chatId: string | null | undefined,
  ensureChatId?: () => Promise<string | null>,
) {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const idCounter = useRef(0);

  const update = useCallback((id: string, patch: Partial<ChatAttachment>) => {
    setAttachments((prev) => prev.map((a) => (a.documentId === id ? { ...a, ...patch } : a)));
  }, []);

  const removeOne = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.documentId !== id));
  }, []);

  const toggleActive = useCallback((id: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.documentId === id ? { ...a, active: !a.active } : a)),
    );
  }, []);

  const reset = useCallback(() => setAttachments([]), []);

  // Clear attachments when chatId changes.
  useEffect(() => {
    setAttachments([]);
  }, [chatId]);

  const upload = useCallback(
    async (files: File[]) => {
      let activeChatId = chatId ?? null;
      const needsRealChat =
        !activeChatId ||
        activeChatId.startsWith("temp-") ||
        activeChatId.startsWith("guest-");
      if (needsRealChat) {
        if (!ensureChatId) {
          toast.error("Send your first message to start the chat, then attach files.");
          return;
        }
        try {
          activeChatId = await ensureChatId();
        } catch (e) {
          toast.error(`Could not start chat: ${String((e as any)?.message ?? e)}`);
          return;
        }
        if (!activeChatId || activeChatId.startsWith("temp-") || activeChatId.startsWith("guest-")) {
          toast.error("Sign in to attach files to a chat.");
          return;
        }
      }

      if (attachments.length + files.length > MAX_FILES) {
        toast.error(`Limit is ${MAX_FILES} files per chat.`);
        return;
      }

      for (const file of files) {
        const { file: safeFile, changed } = withSanitizedName(file);
        if (changed) toast.message(`Renamed "${file.name}" → "${safeFile.name}" for upload.`);

        const reason = validateFile(safeFile);
        if (reason) { toast.error(`${safeFile.name}: ${reason}`); continue; }

        const ft = detectType(safeFile.name) ?? "txt";
        const uploadMime = mimeForUpload(safeFile, ft);
        const tempId = `tmp-${++idCounter.current}`;
        setAttachments((prev) => [
          ...prev,
          {
            documentId: tempId,
            fileName: safeFile.name,
            mimeType: uploadMime,
            fileType: ft,
            size: safeFile.size,
            status: "uploading",
            active: true,
            file: safeFile,
          },
        ]);

        const uploadStart = Date.now();
        track({ event_name: "file.upload_started", category: "file", chat_id: activeChatId, properties: { mime: uploadMime, size: safeFile.size, ext: ft } });

        try {
          let parsedText = "";
          let pageCount: number | undefined;
          let storagePath: string | undefined;
          let imageBase64: string | undefined;

          if (IMAGE_EXTS.has(ft)) {
            // Images: keep base64 for vision rendering AND upload for OCR via parse-attachment.
            update(tempId, { status: "processing" });
            imageBase64 = normalizeDataUrlMime(await readFileAsDataURL(safeFile), uploadMime);

            try {
              const uuid = crypto.randomUUID();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              storagePath = `${user.id}/chats/${activeChatId}/${uuid}-${safeFile.name}`;

              const { error: upErr } = await supabase.storage
                .from("chat-uploads")
                .upload(storagePath, safeFile, { contentType: uploadMime, upsert: false });
              if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

              const { data: parseRes, error: parseErr } = await supabase.functions.invoke(
                "parse-attachment",
                { body: { storagePath, mimeType: uploadMime, fileName: safeFile.name, chatSessionId: activeChatId } },
              );
              if (parseErr) throw new Error(`OCR failed: ${(parseErr as any)?.message ?? parseErr}`);
              if (parseRes?.error) throw new Error(`parse-attachment: ${parseRes.error}`);
              parsedText = parseRes?.parsedText ?? "";

              if (Array.isArray(parseRes?.warnings) && parseRes.warnings.length > 0) {
                for (const w of parseRes.warnings as string[]) {
                  toast.message(`${safeFile.name}: ${w}`);
                }
              }
            } catch (ocrErr: any) {
              // OCR is best-effort — image still works as vision input.
              const msg = String(ocrErr?.message ?? ocrErr);
              console.warn(`Image OCR skipped for ${safeFile.name}:`, msg);
              toast.message(`${safeFile.name}: image attached without OCR (${msg.slice(0, 80)})`);
              parsedText = "";
              storagePath = undefined;
            }

            update(tempId, { status: "ready", imageBase64, parsedText: parsedText || undefined, storagePath });
          } else {
            // Text and binary documents go through parse-attachment so scans run before persistence.
            const uuid = crypto.randomUUID();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            storagePath = `${user.id}/chats/${activeChatId}/${uuid}-${safeFile.name}`;

            const { error: upErr } = await supabase.storage
              .from("chat-uploads")
              .upload(storagePath, safeFile, { contentType: uploadMime, upsert: false });
            if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

            update(tempId, { status: "processing", storagePath });

            const { data: parseRes, error: parseErr } = await supabase.functions.invoke(
              "parse-attachment",
              { body: { storagePath, mimeType: uploadMime, fileName: safeFile.name, chatSessionId: activeChatId } },
            );
            if (parseErr) throw new Error(`Parse failed: ${(parseErr as any)?.message ?? parseErr}`);
            if (parseRes?.error) throw new Error(`parse-attachment: ${parseRes.error}`);
            parsedText = parseRes?.parsedText ?? "";
            pageCount = parseRes?.pageCount ?? undefined;

            // Surface any parser warnings (e.g. scanned PDF detected).
            if (Array.isArray(parseRes?.warnings) && parseRes.warnings.length > 0) {
              for (const w of parseRes.warnings as string[]) {
                toast.warning(`${safeFile.name}: ${w}`);
              }
            }

            update(tempId, { status: "ready", parsedText, pageCount, storagePath });
          }

          // Persist parsed text so future turns (any model) can read this file.
          // Images with OCR text are persisted; images with empty OCR are session-only.
          if (!parsedText || parsedText.trim().length === 0 || !activeChatId) {
            update(tempId, { persistStatus: "skipped" });
          } else {
            update(tempId, { persistStatus: "pending" });
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                update(tempId, { persistStatus: "failed", persistError: "Not authenticated" });
              } else {
                const { data: insRows, error: insErr } = await supabase
                  .from("chat_attachments")
                  .insert({
                    chat_id: activeChatId,
                    user_id: user.id,
                    file_name: safeFile.name,
                    file_type: ft,
                    mime_type: uploadMime,
                    size: safeFile.size,
                    page_count: pageCount ?? null,
                    parsed_text: parsedText,
                    storage_path: storagePath ?? null,
                  })
                  .select("id")
                  .single();
                if (insErr) {
                  console.warn("chat_attachments persist failed:", insErr.message, insErr);
                  toast.error(`Could not save "${safeFile.name}" for follow-up turns: ${insErr.message}`);
                  update(tempId, { persistStatus: "failed", persistError: insErr.message });
                } else {
                  console.log(`📎 chat_attachments saved id=${insRows?.id} for chat=${activeChatId}`);
                  update(tempId, { persistStatus: "saved", persistedRowId: insRows?.id });
                }
              }
            } catch (persistErr: any) {
              const msg = String(persistErr?.message ?? persistErr);
              console.warn("chat_attachments persist failed:", persistErr);
              update(tempId, { persistStatus: "failed", persistError: msg });
            }
          }

          track({ event_name: "file.upload_succeeded", category: "file", chat_id: activeChatId, duration_ms: Date.now() - uploadStart, properties: { mime: uploadMime, size: safeFile.size, ext: ft } });
        } catch (e: any) {
          const msg = String(e?.message ?? e);
          update(tempId, { status: "error", error: msg });
          toast.error(`${safeFile.name}: ${msg}`);
          track({ event_name: "file.upload_failed", category: "file", chat_id: activeChatId, properties: { error: msg.slice(0, 200) } });
        }
      }
    },
    [attachments.length, chatId, ensureChatId, update],
  );

  const retry = useCallback(
    async (id: string) => {
      const a = attachments.find((x) => x.documentId === id);
      if (!a?.file) return;
      setAttachments((prev) => prev.filter((x) => x.documentId !== id));
      await upload([a.file]);
    },
    [attachments, upload],
  );

  const retryPersist = useCallback(
    async (id: string) => {
      const a = attachments.find((x) => x.documentId === id);
      if (!a || !a.parsedText || !chatId) return;
      update(id, { persistStatus: "pending", persistError: undefined });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          update(id, { persistStatus: "failed", persistError: "Not authenticated" });
          return;
        }
        const { data: insRows, error: insErr } = await supabase
          .from("chat_attachments")
          .insert({
            chat_id: chatId,
            user_id: user.id,
            file_name: a.fileName,
            file_type: a.fileType,
            mime_type: a.mimeType,
            size: a.size,
            page_count: a.pageCount ?? null,
            parsed_text: a.parsedText,
            storage_path: a.storagePath ?? null,
          })
          .select("id")
          .single();
        if (insErr) {
          toast.error(`Could not save "${a.fileName}": ${insErr.message}`);
          update(id, { persistStatus: "failed", persistError: insErr.message });
        } else {
          update(id, { persistStatus: "saved", persistedRowId: insRows?.id });
        }
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        update(id, { persistStatus: "failed", persistError: msg });
      }
    },
    [attachments, chatId, update],
  );

  return { attachments, upload, removeOne, toggleActive, retry, retryPersist, reset };
}
