import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const ChatLoadingSkeleton = () => {
  return (
    <div className="flex h-screen-safe bg-background">
      {/* Sidebar skeleton - hidden on mobile */}
      <div className="hidden sm:flex w-[260px] shrink-0 flex-col border-r border-border bg-muted/30 p-4 gap-4">
        <div className="flex items-center gap-3 px-2 py-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-24" />
        </div>

        <Skeleton className="h-10 w-full rounded-md" />

        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-brand-yellow" />
          <span className="text-xs">Loading your chats…</span>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded sm:hidden" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-yellow" />
          <p className="text-sm font-medium text-foreground">Loading your chats…</p>
          <p className="text-xs text-muted-foreground">Just a moment while we get things ready.</p>
        </div>

        <div className="p-4 border-t border-border">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingSkeleton;
