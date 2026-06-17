import React, { useRef, useState, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInputButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ChatGPT-style voice input. Tap to start recording, tap again to stop.
 * Audio is sent to the `voice-transcribe` edge function (OpenAI Whisper)
 * and the resulting text is handed back via `onTranscribed`.
 */
const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscribed, disabled, className }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { window.clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  const pickMimeType = (): string => {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported?.(c)) return c;
    }
    return '';
  };

  const startRecording = async () => {
    if (disabled || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleStop;
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
      // Hard stop at 2 minutes
      autoStopRef.current = window.setTimeout(() => stopRecording(), 120_000);
    } catch (err: any) {
      console.error('Mic access failed', err);
      toast.error('Microphone access denied', {
        description: 'Allow microphone access in your browser to use voice input.',
      });
      cleanup();
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch { /* ignore */ }
    }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { window.clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    setIsRecording(false);
  };

  const handleStop = async () => {
    const chunks = chunksRef.current;
    const stream = streamRef.current;
    chunksRef.current = [];
    if (stream) { stream.getTracks().forEach(t => t.stop()); streamRef.current = null; }

    if (!chunks.length) { setIsTranscribing(false); return; }
    const mimeType = chunks[0].type || 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 1000) {
      toast.message('Nothing recorded', { description: 'Hold the mic a little longer.' });
      return;
    }

    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke('voice-transcribe', {
        body: { audio: base64, mimeType },
      });
      if (error) {
        const { describeInvokeError } = await import('@/lib/invokeError');
        throw new Error(await describeInvokeError(error, 'voice-transcribe'));
      }
      if (data?.error) throw new Error(`voice-transcribe: ${data.error}`);
      const text = (data?.text || '').trim();
      if (text) {
        onTranscribed(text);
      } else {
        toast.message('No speech detected');
      }
    } catch (err: any) {
      console.error('Transcription failed', err);
      toast.error('Transcription failed', { description: err?.message || 'Please try again.' });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (isTranscribing) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(1, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      aria-label={isRecording ? 'Stop recording' : 'Record voice'}
      title={isRecording ? `Stop (${mm}:${ss})` : 'Record voice'}
      className={cn(
        'h-9 flex items-center justify-center rounded-full transition-colors',
        isRecording
          ? 'px-3 gap-2 bg-red-500/15 text-red-500 hover:bg-red-500/25'
          : 'w-9 text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus-ring',
        isTranscribing && 'opacity-60 cursor-wait',
        className,
      )}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Mic className={cn('h-4 w-4', isRecording && 'animate-pulse')} />
          {isRecording && <span className="text-xs tabular-nums font-medium">{mm}:{ss}</span>}
        </>
      )}
    </button>
  );
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export default VoiceInputButton;