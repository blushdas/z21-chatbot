import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import posthog from 'posthog-js'
import App from './App.tsx'
import './index.css'
import './styles/globals.css'
import './styles/chat-animations.css'

// Stable context object for react-helmet-async to prevent
// "Cannot read properties of undefined (reading 'add')" on re-renders.
const helmetContext = {}

// Initialize PostHog
posthog.init('phc_lJ8gNLpeZOlQoURp5PR2QQrv8zwoz309rir0QEwc1w', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
})

createRoot(document.getElementById("root")!).render(
  <HelmetProvider context={helmetContext}>
    <App />
  </HelmetProvider>
);
