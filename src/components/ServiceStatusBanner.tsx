/**
 * ServiceStatusBanner
 * --------------------------------------------------------------------------
 * LAYOUT CONTRACT (do not break):
 *  - This banner MUST render in normal document flow at the app root
 *    (rendered above <AppRoutes /> inside a flex-column wrapper in App.tsx).
 *  - Do NOT use `fixed` or `absolute` positioning. Do NOT raise z-index to
 *    100+. Every routed page has its own top-anchored header (ChatHeader,
 *    landing nav, admin nav, etc). A fixed banner overlays them and clips
 *    primary navigation (mode pills, Daryle AI / Advisor tabs, Favorites,
 *    Canvases). Keep it relative so it pushes content down instead.
 *  - A Vitest guard in `__tests__/ServiceStatusBanner.test.tsx` fails the
 *    build if the root element regains `fixed`/`absolute` positioning.
 * --------------------------------------------------------------------------
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertTriangle, RefreshCw, X, CheckCircle } from 'lucide-react';
import { useSupabaseHealthOptional } from '@/context/SupabaseHealthContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type BannerState = 'hidden' | 'offline' | 'degraded' | 'reconnecting' | 'restored';

export const ServiceStatusBanner: React.FC = () => {
  const health = useSupabaseHealthOptional();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const [dismissed, setDismissed] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  useEffect(() => {
    if (!health) return;

    const { isOffline, isDegraded, reconnecting, isOnline } = health;

    // Determine banner state based on health
    if (isOffline) {
      setBannerState('offline');
      setDismissed(false); // Reset dismiss on new offline event
    } else if (reconnecting) {
      setBannerState('reconnecting');
      setDismissed(false);
    } else if (isDegraded) {
      setBannerState('degraded');
    } else if (isOnline && bannerState !== 'hidden' && bannerState !== 'restored') {
      // Just came back online from a problem state
      setBannerState('restored');
      setShowRestoredBanner(true);
      
      // Auto-dismiss restored banner after 3 seconds
      const timer = setTimeout(() => {
        setBannerState('hidden');
        setShowRestoredBanner(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [health?.isOffline, health?.isDegraded, health?.reconnecting, health?.isOnline, bannerState]);

  // Don't render if health context isn't available or banner should be hidden
  if (!health) return null;
  if (bannerState === 'hidden' && !showRestoredBanner) return null;
  if (dismissed && bannerState !== 'offline') return null;

  const getBannerConfig = () => {
    switch (bannerState) {
      case 'offline':
        return {
          icon: WifiOff,
          title: "You're offline",
          message: "Messages will be saved locally and sent when you reconnect.",
          bgClass: 'bg-destructive/95',
          textClass: 'text-destructive-foreground',
          iconClass: 'text-destructive-foreground',
          showProgress: false,
          dismissible: false,
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          title: 'Connection issues',
          message: "Some services are experiencing delays. Your work is being saved locally.",
          bgClass: 'bg-[var(--color-warning-soft)] border-y border-[var(--color-warning-border)]',
          textClass: 'text-[color:var(--color-warning)]',
          iconClass: 'text-[color:var(--color-warning)]',
          showProgress: false,
          dismissible: true,
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          title: 'Reconnecting',
          message: "Connection restored. Syncing your data...",
          bgClass: 'bg-[var(--color-info-soft)] border-y border-[var(--color-info-border)]',
          textClass: 'text-[color:var(--color-info)]',
          iconClass: 'text-[color:var(--color-info)] animate-spin',
          showProgress: true,
          dismissible: false,
        };
      case 'restored':
        return {
          icon: CheckCircle,
          title: 'Connection restored',
          message: "All services are back online.",
          bgClass: 'bg-[var(--color-success-soft)] border-y border-[var(--color-success-border)]',
          textClass: 'text-[color:var(--color-success)]',
          iconClass: 'text-[color:var(--color-success)]',
          showProgress: false,
          dismissible: true,
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        data-testid="service-status-banner"
        className={cn(
          // Intentionally in-flow (relative). See LAYOUT CONTRACT above.
          'relative w-full z-[60] shadow-lg',
          config.bgClass
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-semibold', config.textClass)}>
                    {config.title}
                  </span>
                  <span className={cn('text-sm opacity-90', config.textClass)}>
                    {config.message}
                  </span>
                </div>
                
                {config.showProgress && health.syncProgress > 0 && (
                  <div className="mt-2 max-w-xs">
                    <Progress 
                      value={health.syncProgress} 
                      className="h-1.5 bg-[var(--ui-bg-hover)]"
                    />
                    <span className={cn('text-xs mt-1', config.textClass)}>
                      Syncing... {health.syncProgress}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {config.dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className={cn(
                  'p-1.5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0',
                  config.textClass
                )}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServiceStatusBanner;
