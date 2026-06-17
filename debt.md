# Z21 Chatbot — Tech Debt

## Status: LIVE (scaffold phase)
- URL: https://z21-chatbot-ten.vercel.app
- Repo: https://github.com/blushdas/z21-chatbot
- Build: ✅ passing (Vite, 3,716 modules, 2.9MB bundle)
- Runtime: ✅ renders without crashes (Supabase not wired = expected loading state)

---

## Critical: Must fix before production

### 1. Supabase credentials not wired
`.env.example` has placeholder values. `.env` is not committed.
- Need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env vars
- The Edge function `openai-assistant-chat` doesn't exist for Z21 — needs to be created or replaced with a Z21-specific API
- Auth flows (login, signup, 2FA) will fail without real Supabase + Edge function

### 2. "Something went wrong" crash — FIXED but tech debt remains
Root cause: React context providers throwing when mounted outside the provider tree.
Fixed by replacing all 14 throw guards with defensive defaults returning null/empty state.
- **Pattern used:** `if (!ctx) return { user: null, loading: true, ... }`
- **Files patched:** 13 files across `context/` and `hooks/`
- **Tradeoff:** Components may render with empty state instead of crashing — but some features silently do nothing. Needs cleanup pass to restore proper error handling for production.

### 3. Daryle landing components still in `src/components/landing/`
These pull Daryle copy/branding. Not shown in app but increase bundle size and create confusion.

### 4. Daryle-specific pages in `src/pages/`
Admin, Align, Beta, Roadmap, FAQ, Contact, etc. — all Daryle pages still present.
Not routed but bundled. Should be removed or gutted.

---

## High priority

### 5. Re-skin — Z21 design language not applied to chat UI
The chat interface (MessageBubble, ChatInput, ChatHeader, WelcomeMessage, SavedChatsSidebar) still uses Daryle's blue/white styling. Only the landing page shell has Z21 styling (black bg, gold accent).

Files to re-skin:
- `src/components/ChatMessage.tsx`
- `src/components/ChatInputArea.tsx`
- `src/components/ChatInputSection.tsx`
- `src/components/ChatHeader.tsx`
- `src/components/ChatTopNav.tsx`
- `src/components/WelcomeMessage.tsx`
- `src/components/SavedChatsSidebar.tsx`
- `src/components/SidebarToggleButton.tsx`
- `src/components/landing/*` (replace Daryle landing with Z21 pages)

Design tokens from z21hq.xyz:
- Background: `#000000` (pure black), panels: `#090909`
- Text: white primary, muted secondary
- Accent: `#b79a70` (muted gold/champagne)
- Font: Bebas Neue for display, Inter for body
- Section labels: `01 — ABOUT` uppercase letter-spaced format

### 6. Auth pages not Z21-styled
`src/pages/AuthPage.tsx`, `LoginPage`, `SignUpPage` — still Daryle UI.

### 7. index.html — Daryle title + tracking scripts
- Title says "Daryle AI" — already changed to "Z21 Chatbot"
- Google Analytics tag: `G-TK8MPG1R0T` (Daryle's)
- TruConversion script: `57225/666e0.js` (Daryle's)
- Google Fonts: Lora + Roboto (Daryle fonts, not Z21)

### 8. `src/integrations/supabase/client.ts` — Daryle project ref
Supabase URL and anon key are Daryle's. Need Z21 project.

### 9. `src/lib/analytics.ts` — Daryle analytics
Wires to Daryle analytics, not Z21.

---

## Medium priority

### 10. Bundle size: 2.9MB
- Admin pages, Align, Canvas, Commentary, Verification, Tour, onboarding flows all bundled
- 3,716 modules compiled
- No code splitting configured
- Should lazy-load heavy feature pages

### 11. `public/` assets from Daryle
`src/assets/` has Daryle model images (claude.png, gemini.png, openai.png). These are fine for now as they're model icons, but branding should be replaced.

### 12. Duplicate files
`ChatFavoritesContext 2.tsx`, `useCanvas 2.ts`, `useClientValue 2.ts`, etc. — came from Daryle copy. Should be audited and deduped.

### 13. "Loading your chats..." — infinite loading
Without Supabase wired, the app renders but is stuck on loading. Should show a clearer unauthenticated state or Z21-branded empty state.

---

## Architecture notes

- Context provider order in `App.tsx` matters. Current order:
  `AppReadyProvider → BrandProvider → AuthProvider → SupabaseHealthProvider → FavoritesProvider → ChatFavoritesProvider → FolderProvider → ChatManagementProvider → CitationVisibilityProvider → SidebarProvider → SourceDrawerProvider → SourceComparisonProvider → TourProvider`
- All context hooks converted to return defaults instead of throwing — this is defensive but may mask real bugs
- `src/pages/Index.tsx` is the chat page — wraps `ChatInterface` with sidebar and panels
- Route: `/` and `/chat` both render `Index` (the chat interface)
