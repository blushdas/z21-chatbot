import { toast } from '@/hooks/use-toast';

export function toastError(
  errorOrMessage: unknown,
  title = 'Error',
  fallbackDescription?: string
) {
  const description =
    errorOrMessage instanceof Error
      ? errorOrMessage.message
      : typeof errorOrMessage === 'string'
        ? errorOrMessage
        : (fallbackDescription ?? 'An unexpected error occurred');
  console.error(`[${title}]`, errorOrMessage);
  toast({ title, description, variant: 'destructive' });
}
