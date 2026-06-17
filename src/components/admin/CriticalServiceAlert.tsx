import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ServiceHealthRow {
  service: string;
  status: string;
  checked_at: string;
  latency_ms: number | null;
  error_message: string | null;
}

interface DownAlert {
  service: string;
  serviceLabel: string;
  firstDownAt: string;
  errorMessage: string | null;
  latencyMs: number | null;
  dedupeKey: string;
}

// Fetch last 4 rows per service from service_health
async function fetchRecentHealthRows(): Promise<ServiceHealthRow[]> {
  // Fetch last 4 rows for openai
  const [openaiRes, pineconeRes] = await Promise.all([
    supabase
      .from('service_health')
      .select('service, status, checked_at, latency_ms, error_message')
      .eq('service', 'openai')
      .order('checked_at', { ascending: false })
      .limit(4),
    supabase
      .from('service_health')
      .select('service, status, checked_at, latency_ms, error_message')
      .eq('service', 'pinecone')
      .order('checked_at', { ascending: false })
      .limit(4),
  ]);

  const rows: ServiceHealthRow[] = [
    ...(openaiRes.data ?? []),
    ...(pineconeRes.data ?? []),
  ];

  return rows;
}

function detectConsecutiveDownAlerts(rows: ServiceHealthRow[]): DownAlert[] {
  const byService: Record<string, ServiceHealthRow[]> = {};

  for (const row of rows) {
    if (!byService[row.service]) byService[row.service] = [];
    byService[row.service].push(row);
  }

  const alerts: DownAlert[] = [];

  for (const [service, serviceRows] of Object.entries(byService)) {
    // Rows are already ordered DESC (most recent first)
    if (serviceRows.length >= 2 && serviceRows[0].status === 'down' && serviceRows[1].status === 'down') {
      const firstDownAt = serviceRows[1].checked_at; // earlier of the two consecutive
      alerts.push({
        service,
        serviceLabel: service === 'openai' ? 'OpenAI' : 'Pinecone',
        firstDownAt,
        errorMessage: serviceRows[0].error_message,
        latencyMs: serviceRows[0].latency_ms,
        dedupeKey: `dismissed-alert-${service}-${firstDownAt}`,
      });
    }
  }

  return alerts;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function sendClientSideAlert(alert: DownAlert): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    const serviceLabel = alert.serviceLabel;
    const subject = `🚨 URGENT: ${serviceLabel} is DOWN — Daryle AI`;
    const timestamp = new Date(alert.firstDownAt).toUTCString();
    const healthUrl = `${window.location.origin}/admin/service-health`;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:2px solid #dc2626;border-radius:8px;overflow:hidden;">
        <div style="background:#dc2626;padding:16px 24px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">🚨 CRITICAL SERVICE ALERT</h1>
        </div>
        <div style="padding:24px;background:#fff;">
          <p style="font-size:16px;margin-top:0;">
            <strong>${serviceLabel}</strong> has been recorded as <strong>DOWN</strong> for 2+ consecutive health checks on Daryle AI.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="background:#fef2f2;">
              <td style="padding:8px 12px;font-weight:bold;width:140px;">Service</td>
              <td style="padding:8px 12px;">${serviceLabel}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;">Status</td>
              <td style="padding:8px 12px;color:#dc2626;font-weight:bold;">DOWN</td>
            </tr>
            <tr style="background:#fef2f2;">
              <td style="padding:8px 12px;font-weight:bold;">First Detected</td>
              <td style="padding:8px 12px;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;">Error</td>
              <td style="padding:8px 12px;">${alert.errorMessage ?? 'N/A'}</td>
            </tr>
          </table>
          <div style="margin-top:24px;">
            <a href="${healthUrl}" style="background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;display:inline-block;">
              → View Service Health Dashboard
            </a>
          </div>
        </div>
      </div>
    `;

    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: 'troy@astraapplications.com',
        subject,
        html,
        text: `URGENT: ${serviceLabel} is DOWN on Daryle AI.\n\nFirst detected: ${timestamp}\nError: ${alert.errorMessage ?? 'N/A'}\n\nView dashboard: ${healthUrl}`,
      }),
    });

    console.log(`✅ Client-side alert email queued for ${serviceLabel}`);
  } catch (err) {
    console.error('Failed to send client-side alert email:', err);
  }
}

const CriticalServiceAlert: React.FC = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin';
  // Track which dedupe keys we've already emailed this session
  const emailedThisSession = useRef<Set<string>>(new Set());
  // Track dismissed banners
  const [dismissed, setDismissed] = React.useState<Set<string>>(() => {
    // Preload any existing dismissals from sessionStorage
    const keys = new Set<string>();
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('dismissed-alert-')) keys.add(key);
    }
    return keys;
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['service-health-consecutive'],
    queryFn: async (): Promise<DownAlert[]> => {
      const rows = await fetchRecentHealthRows();
      return detectConsecutiveDownAlerts(rows);
    },
    refetchInterval: 60_000, // poll every 60s
    enabled: isSuperAdmin,
  });

  // Send client-side email for any new alerts not already deduped
  useEffect(() => {
    for (const alert of alerts) {
      if (emailedThisSession.current.has(alert.dedupeKey)) continue;
      // Check sessionStorage for this key (handles page refreshes)
      const alreadySent = sessionStorage.getItem(`email-sent-${alert.dedupeKey}`);
      if (alreadySent) {
        emailedThisSession.current.add(alert.dedupeKey);
        continue;
      }
      // Mark as sent before awaiting to prevent double-sends
      emailedThisSession.current.add(alert.dedupeKey);
      sessionStorage.setItem(`email-sent-${alert.dedupeKey}`, '1');
      sendClientSideAlert(alert);
    }
  }, [alerts]);

  // Active alerts = detected alerts that haven't been dismissed
  // Reset dismissal if a NEW incident dedupeKey appears (different firstDownAt)
  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.dedupeKey));

  const handleDismiss = (dedupeKey: string) => {
    sessionStorage.setItem(dedupeKey, 'dismissed');
    setDismissed((prev) => new Set([...prev, dedupeKey]));
  };

  if (!isSuperAdmin || visibleAlerts.length === 0) return null;

  return (
    <AnimatePresence>
      {visibleAlerts.map((alert) => (
        <motion.div
          key={alert.dedupeKey}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ background: '#dc2626', color: '#fff' }}
          className="w-full z-50"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              {/* Pulsing dot */}
              <span className="relative flex-shrink-0 mt-0.5 sm:mt-0">
                <span
                  className="animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75"
                  style={{ background: '#fff' }}
                />
                <span
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ background: '#fff' }}
                />
              </span>

              <AlertCircle className="h-5 w-5 flex-shrink-0" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                <span className="font-bold text-sm whitespace-nowrap">
                  CRITICAL: {alert.serviceLabel} is DOWN
                </span>
                <span className="hidden sm:block" style={{ opacity: 0.7 }}>·</span>
                <span className="text-xs sm:text-sm" style={{ opacity: 0.9 }}>
                  2+ consecutive failures · First detected{' '}
                  <strong>
                    {formatDistanceToNow(new Date(alert.firstDownAt), { addSuffix: true })}
                  </strong>
                  {alert.errorMessage && (
                    <span className="ml-1" style={{ opacity: 0.75 }}>({alert.errorMessage})</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to="/admin/service-health"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-80 whitespace-nowrap"
                style={{ color: '#fff' }}
              >
                View Service Health
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <button
                onClick={() => handleDismiss(alert.dedupeKey)}
                className="p-1 rounded transition-opacity hover:opacity-70"
                style={{ color: '#fff' }}
                aria-label={`Dismiss ${alert.serviceLabel} alert`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default CriticalServiceAlert;
