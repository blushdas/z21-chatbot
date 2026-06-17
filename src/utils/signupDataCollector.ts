/**
 * Collects comprehensive client-side data at sign-up time for analytics and security.
 * All data is standard browser-available information (no personal data beyond what user provides).
 */

export interface SignupClientData {
  // Device & Browser
  userAgent: string;
  platform: string;
  
  // Location & Time
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  
  // Screen
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  touchPoints: number;
  
  // Network
  connectionType: string | null;
  
  // Referral
  referrerUrl: string;
  signupUrl: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}

/**
 * Collects all available client-side data for sign-up logging.
 * This runs in the browser and gathers non-sensitive technical metadata.
 */
export function collectSignupData(): SignupClientData {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Get connection info if available (experimental API)
  const connection = (navigator as any).connection;
  
  return {
    // Device & Browser
    userAgent: navigator.userAgent || '',
    platform: navigator.platform || '',
    
    // Location & Time
    language: navigator.language || '',
    languages: Array.from(navigator.languages || [navigator.language || '']),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Screen
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    colorDepth: window.screen?.colorDepth || 0,
    touchPoints: navigator.maxTouchPoints || 0,
    
    // Network
    connectionType: connection?.effectiveType || null,
    
    // Referral
    referrerUrl: document.referrer || '',
    signupUrl: window.location.href || '',
    utmSource: urlParams.get('utm_source'),
    utmMedium: urlParams.get('utm_medium'),
    utmCampaign: urlParams.get('utm_campaign'),
    utmTerm: urlParams.get('utm_term'),
    utmContent: urlParams.get('utm_content'),
  };
}

/**
 * Parses user agent string to extract browser and OS info.
 * This is done server-side in the trigger, but can also be used client-side.
 */
export function parseUserAgent(ua: string): {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
} {
  // Browser detection
  let browserName = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+\.?\d*)/)?.[1] || '';
  }
  
  // OS detection
  let osName = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('Windows NT')) {
    osName = 'Windows';
    const ntVersion = ua.match(/Windows NT (\d+\.?\d*)/)?.[1];
    if (ntVersion === '10.0') osVersion = '10/11';
    else if (ntVersion === '6.3') osVersion = '8.1';
    else if (ntVersion === '6.2') osVersion = '8';
    else if (ntVersion === '6.1') osVersion = '7';
  } else if (ua.includes('Mac OS X')) {
    osName = 'macOS';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Android')) {
    osName = 'Android';
    osVersion = ua.match(/Android (\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    osName = 'iOS';
    osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    osName = 'Linux';
  }
  
  // Device type detection
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  
  if (/Mobi|Android.*Mobile|iPhone|iPod/.test(ua)) {
    deviceType = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    deviceType = 'tablet';
  }
  
  return { browserName, browserVersion, osName, osVersion, deviceType };
}
