import { supabase } from '@/integrations/supabase/client';
import { describeInvokeError } from '@/lib/invokeError';

type CompressTextResponse = {
  compressed?: string;
};

export async function compressText(text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('compress-text', {
    body: { text },
  });

  if (error) throw new Error(await describeInvokeError(error, 'compress-text'));

  const compressed = (data as CompressTextResponse | null)?.compressed;
  if (!compressed) {
    throw new Error('Compress failed: empty response');
  }

  return compressed;
}
