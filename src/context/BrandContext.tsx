import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DemoBrand {
  id: string;
  name: string;
  slug: string;
  product_name: string;
  primary_hsl: string;
  accent_hsl: string;
  background_hsl: string | null;
  foreground_hsl: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
}

interface BrandContextValue {
  activeBrand: DemoBrand | null;
  productName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  voiceName: string;
  brandText: (text: string) => string;
  activate: (brand: DemoBrand) => void;
  deactivate: () => void;
}

const STORAGE_KEY = 'demo_brand_v1';
const STYLE_ID = 'demo-brand-tokens';
const FAVICON_BACKUP = '__demo_brand_original_favicon';

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

function readStored(): DemoBrand | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoBrand) : null;
  } catch {
    return null;
  }
}

function applyTokens(brand: DemoBrand | null) {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
  if (!brand) return;
  const rootRules: string[] = [];
  const primary = brand.primary_hsl;
  const accent = brand.accent_hsl;
  if (primary) {
    rootRules.push(`--primary: ${primary};`);
    // Map legacy brand-blue token to the brand primary so any UI that still
    // references --brand-blue picks up the white-label color.
    rootRules.push(`--brand-blue: ${primary};`);
    rootRules.push(`--ring: ${accent || primary};`);
  }
  if (accent) {
    rootRules.push(`--accent: ${accent};`);
    // Legacy brand-yellow (gold) token — remap to the brand accent so all
    // gold buttons, mode chips, highlights, etc. recolor automatically.
    rootRules.push(`--brand-yellow: ${accent};`);
  }
  if (brand.background_hsl) rootRules.push(`--background: ${brand.background_hsl};`);
  if (brand.foreground_hsl) rootRules.push(`--foreground: ${brand.foreground_hsl};`);
  if (rootRules.length === 0) return;

  // The hardcoded .bg-brand-yellow / .text-brand-blue utility classes in
  // index.css use literal hex values, so CSS variables alone won't recolor
  // them. Override those classes here using hsl() of the brand tokens.
  const accentHsl = accent ? `hsl(${accent})` : undefined;
  const primaryHsl = primary ? `hsl(${primary})` : undefined;
  const accentParts = accent ? accent.split(' ') : null;
  const primaryParts = primary ? primary.split(' ') : null;
  const toHslA = (parts: string[] | null, a: number) =>
    parts ? `hsl(${parts[0]} ${parts[1]} ${parts[2]} / ${a})` : undefined;

  // Pick a legible foreground (near-black or white) for a given HSL background
  // using WCAG relative luminance, so brand accents like Solv's muted brown get
  // white text instead of low-contrast brand-blue/teal.
  const readableForeground = (hsl: string | undefined): string => {
    if (!hsl) return '0 0% 100%';
    const [hRaw, sRaw, lRaw] = hsl.trim().split(/\s+/);
    const h = parseFloat(hRaw);
    const s = parseFloat(sRaw) / 100;
    const l = parseFloat(lRaw) / 100;
    if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) return '0 0% 100%';
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const toLin = (v: number) => {
      const cv = v + m;
      return cv <= 0.03928 ? cv / 12.92 : Math.pow((cv + 0.055) / 1.055, 2.4);
    };
    const lum = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    return lum > 0.45 ? '0 0% 12%' : '0 0% 100%';
  };
  const accentForeground = `hsl(${readableForeground(accent)})`;
  const primaryForeground = `hsl(${readableForeground(primary)})`;

  const utilityRules: string[] = [];
  if (accentHsl) {
    utilityRules.push(`.text-brand-yellow { color: ${accentHsl} !important; }`);
    utilityRules.push(`.bg-brand-yellow { background-color: ${accentHsl} !important; }`);
    utilityRules.push(`.border-brand-yellow { border-color: ${accentHsl} !important; }`);
    utilityRules.push(`.ring-brand-yellow { --tw-ring-color: ${accentHsl} !important; }`);
    utilityRules.push(`.hover\\:bg-brand-yellow:hover { background-color: ${accentHsl} !important; }`);
    const a90 = toHslA(accentParts, 0.9);
    const a10 = toHslA(accentParts, 0.1);
    if (a90) utilityRules.push(`.hover\\:bg-brand-yellow\\/90:hover { background-color: ${a90} !important; }`);
    if (a10) utilityRules.push(`.bg-brand-yellow\\/10 { background-color: ${a10} !important; }`);
  }
  if (primaryHsl) {
    utilityRules.push(`.text-brand-blue { color: ${primaryHsl} !important; }`);
    utilityRules.push(`.bg-brand-blue { background-color: ${primaryHsl} !important; }`);
    utilityRules.push(`.border-brand-blue { border-color: ${primaryHsl} !important; }`);
    utilityRules.push(`.ring-brand-blue { --tw-ring-color: ${primaryHsl} !important; }`);
  }

  // Contrast guard: when brand-blue text sits on a brand-yellow (accent)
  // background, the two brand colors can clash (e.g. teal on brown). Force a
  // legible foreground for those exact pairings without affecting standalone
  // usages of either utility.
  utilityRules.push(`.bg-brand-yellow.text-brand-blue { color: ${accentForeground} !important; }`);
  utilityRules.push(`.text-brand-blue.bg-brand-yellow { color: ${accentForeground} !important; }`);
  utilityRules.push(`.bg-brand-yellow .text-brand-blue { color: ${accentForeground} !important; }`);
  utilityRules.push(`.bg-brand-blue.text-brand-yellow { color: ${primaryForeground} !important; }`);
  utilityRules.push(`.text-brand-yellow.bg-brand-blue { color: ${primaryForeground} !important; }`);

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `:root, .dark, html.light { ${rootRules.join(' ')} }\n${utilityRules.join('\n')}`;
  document.head.appendChild(style);
}

function applyFavicon(brand: DemoBrand | null) {
  const w = window as unknown as Record<string, string | undefined>;
  if (w[FAVICON_BACKUP] === undefined) {
    const original = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    w[FAVICON_BACKUP] = original?.getAttribute('href') ?? '/favicon.svg';
  }

  // Remove all existing favicon links so the browser actually refreshes
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());

  const link = document.createElement('link');
  link.rel = 'icon';

  const url = brand?.favicon_url ?? w[FAVICON_BACKUP] ?? '/favicon.svg';

  if (url.endsWith('.svg')) link.type = 'image/svg+xml';
  else if (url.endsWith('.png')) link.type = 'image/png';
  else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) link.type = 'image/jpeg';
  else if (url.endsWith('.ico')) link.type = 'image/x-icon';

  // Cache-buster forces the browser to fetch the new icon
  link.href = `${url}?v=${Date.now()}`;

  document.head.appendChild(link);
}

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBrand, setActiveBrand] = useState<DemoBrand | null>(() => readStored());

  useEffect(() => {
    applyTokens(activeBrand);
    applyFavicon(activeBrand);
  }, [activeBrand]);

  const activate = useCallback((brand: DemoBrand) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
    setActiveBrand(brand);
  }, []);

  const deactivate = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setActiveBrand(null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(STORAGE_KEY);
        setActiveBrand(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<BrandContextValue>(
    () => ({
      activeBrand,
      productName: activeBrand?.product_name ?? 'Daryle.AI',
      logoUrl: activeBrand?.logo_url ?? null,
      logoDarkUrl: activeBrand?.logo_dark_url ?? activeBrand?.logo_url ?? null,
      voiceName: activeBrand?.product_name ?? 'Daryle',
      brandText: (text: string) => {
        if (!activeBrand) return text;
        const product = activeBrand.product_name;
        return text
          .replace(/Daryle\.AI/g, product)
          .replace(/Daryle AI/g, product)
          .replace(/Daryle Doden/g, product)
          .replace(/Daryle/g, product);
      },
      activate,
      deactivate,
    }),
    [activeBrand, activate, deactivate],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    // Safe fallback so isolated previews don't crash
    return {
      activeBrand: null,
      productName: 'Daryle.AI',
      logoUrl: null,
      logoDarkUrl: null,
      voiceName: 'Daryle',
      brandText: (text: string) => text,
      activate: () => {},
      deactivate: () => {},
    };
  }
  return ctx;
}