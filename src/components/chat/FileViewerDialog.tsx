import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fileId?: string;
  filename: string;
  page?: number;
};

export const FileViewerDialog: React.FC<Props> = ({ open, onOpenChange, fileId, filename, page }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!open || !fileId) return;
    setLoading(true);
    setError(null);
    setUrl(null);
    setTextContent(null);
    (async () => {
      try {
        const { data: row, error: rowErr } = await supabase
          .from("chat_files")
          .select("storage_path, file_type, deleted_at")
          .eq("id", fileId)
          .maybeSingle();
        if (rowErr || !row?.storage_path) throw new Error(rowErr?.message ?? "File not found");
        if (cancelled) return;
        setFileType(row.file_type);
        const { data: signed, error: signErr } = await supabase
          .storage.from("chat-uploads")
          .createSignedUrl(row.storage_path, 600);
        if (signErr || !signed?.signedUrl) {
          const msg = (signErr?.message || "").toLowerCase();
          if (msg.includes("not found") || msg.includes("object")) {
            throw new Error(
              row.deleted_at
                ? "This file was removed from the chat and is no longer available."
                : "The original file is no longer in storage. Re-upload it to view.",
            );
          }
          throw new Error(signErr?.message ?? "Cannot sign URL");
        }
        if (cancelled) return;
        const isPdf = row.file_type === "pdf";
        if (isPdf) {
          setUrl(page ? `${signed.signedUrl}#page=${page}` : signed.signedUrl);
        } else if (row.file_type === "txt" || row.file_type === "md") {
          const res = await fetch(signed.signedUrl);
          const text = await res.text();
          if (!cancelled) setTextContent(text);
        } else {
          setUrl(signed.signedUrl); // DOCX → download link
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, fileId, page]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">
            {filename}
            {page ? <span className="ml-2 text-xs text-muted-foreground">page {page}</span> : null}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-background">
          {loading && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          )}
          {error && (
            <div className="p-4 text-sm text-destructive">Could not open file: {error}</div>
          )}
          {!loading && !error && fileType === "pdf" && url && (
            <iframe src={url} title={filename} className="w-full h-full" />
          )}
          {!loading && !error && textContent !== null && (
            <pre className="p-4 text-xs whitespace-pre-wrap overflow-auto h-full">{textContent}</pre>
          )}
          {!loading && !error && fileType === "docx" && url && (
            <div className="p-6 text-sm">
              DOCX preview is not supported inline.{" "}
              <a href={url} className="text-primary underline" target="_blank" rel="noreferrer">
                Download {filename}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog;