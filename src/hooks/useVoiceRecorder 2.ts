import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type RecorderState = 'idle' | 'recording' | 'transcribing';

interface Options {
  onTranscribed: (text: string) => void;
  /** Number of bars to expose in `levels`. Default 56. */
  barCount?: number;
  /** Hard stop in ms. Default 120_000. */
  maxDurationMs?: number;
}

const pickMimeType = (): string => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported?.(c)) return c;
  }
  return '';
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

/**
 * ChatGPT-style voice capture. Manages MediaRecorder + an AnalyserNode that
 * powers the live waveform. `commit` transcribes via the `voice-transcribe`
 * edge function; `cancel` throws the recording away.
 */
export function useVoiceRecorder({ onTranscribed, barCount = 56, maxDurationMs = 120_000 }: Options) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(barCount).fill(0));
  const [peaks, setPeaks] = useState<number[]>(() => Array(barCount).fill(0));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const smoothedRef = useRef<number[]>(Array(barCount).fill(0));
  const peakRef = useRef<number[]>(Array(barCount).fill(0));

  const teardown = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { window.clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => handleStop();
      recorderRef.current = recorder;
      recorder.start();

      // Audio analyser for waveform bars
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const step = Math.max(1, Math.floor(analyser.frequencyBinCount / barCount));
      smoothedRef.current = Array(barCount).fill(0);
      peakRef.current = Array(barCount).fill(0);
      // Attack = fast rise toward new amplitude, decay = slow drop (ChatGPT-like).
      const ATTACK = 0.55;
      const DECAY = 0.12;
      const PEAK_DECAY = 0.012;
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const nextLevels: number[] = new Array(barCount);
        const nextPeaks: number[] = new Array(barCount);
        for (let i = 0; i < barCount; i++) {
          const start = i * step;
          let sum = 0;
          let count = 0;
          for (let j = start; j < start + step && j < data.length; j++) {
            sum += data[j];
            count++;
          }
          const avg = count ? sum / count : 0;
          // Normalize 0..1 and gently boost low end so quiet speech still shows.
          const target = Math.min(1, (avg / 255) * 1.6);
          const prev = smoothedRef.current[i];
          // Asymmetric smoothing: snap up, ease down.
          const smoothed = target > prev
            ? prev + (target - prev) * ATTACK
            : prev + (target - prev) * DECAY;
          smoothedRef.current[i] = smoothed;
          // Peak hold that slowly falls toward the smoothed value.
          const peak = peakRef.current[i];
          peakRef.current[i] = smoothed > peak
            ? smoothed
            : Math.max(smoothed, peak - PEAK_DECAY);
          nextLevels[i] = smoothed;
          nextPeaks[i] = peakRef.current[i];
        }
        setLevels(nextLevels);
        setPeaks(nextPeaks);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
      autoStopRef.current = window.setTimeout(() => stopInternal(), maxDurationMs);

      setState('recording');
    } catch (err) {
      console.error('Mic access failed', err);
      toast.error('Microphone access denied', {
        description: 'Allow microphone access in your browser to use voice input.',
      });
      teardown();
      setState('idle');
    }
  }, [state, barCount, maxDurationMs, teardown]);

  const stopInternal = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch { /* ignore */ }
    }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { window.clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }, []);

  const handleStop = useCallback(async () => {
    const chunks = chunksRef.current;
    chunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;

    if (cancelledRef.current) {
      setState('idle');
      setLevels(Array(barCount).fill(0));
      setPeaks(Array(barCount).fill(0));
      return;
    }

    if (!chunks.length) {
      setState('idle');
      return;
    }
    const mimeType = chunks[0].type || 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 1000) {
      toast.message('Nothing recorded', { description: 'Hold the mic a little longer.' });
      setState('idle');
      return;
    }

    setState('transcribing');
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
      if (text) onTranscribed(text);
      else toast.message('No speech detected');
    } catch (err: any) {
      console.error('Transcription failed', err);
      toast.error('Transcription failed', { description: err?.message || 'Please try again.' });
    } finally {
      setState('idle');
      setLevels(Array(barCount).fill(0));
      setPeaks(Array(barCount).fill(0));
    }
  }, [onTranscribed, barCount]);

  const commit = useCallback(() => {
    if (state !== 'recording') return;
    cancelledRef.current = false;
    stopInternal();
  }, [state, stopInternal]);

  const cancel = useCallback(() => {
    if (state === 'idle') return;
    cancelledRef.current = true;
    stopInternal();
    // If transcribing, we can't truly abort the network call but we'll ignore result.
    setState('idle');
    setLevels(Array(barCount).fill(0));
    setPeaks(Array(barCount).fill(0));
  }, [state, stopInternal, barCount]);

  return { state, elapsed, levels, peaks, start, commit, cancel };
}

export default useVoiceRecorder;