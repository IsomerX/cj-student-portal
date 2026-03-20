import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogAvailable = false;

export function isPostHogAvailable() {
  return posthogAvailable;
}

export function initPostHog() {
  if (typeof window === 'undefined' || !POSTHOG_KEY) return;

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskTextSelector: '[data-ph-mask]',
      },
      capture_pageview: false,
      capture_pageleave: true,
      capture_performance: true,
      capture_exceptions: true,
      persistence: 'localStorage+cookie',
      enable_heatmaps: true,
      bootstrap: {},
      on_request_error: () => {
        posthogAvailable = false;
      },
      loaded: (ph) => {
        posthogAvailable = true;
        if (process.env.NODE_ENV === 'development') {
          ph.debug();
        }
      },
    });
  } catch {
    posthogAvailable = false;
  }

  return posthog;
}

export function safePostHog<T>(fn: (ph: typeof posthog) => T): T | undefined {
  if (!posthogAvailable) return undefined;
  try {
    return fn(posthog);
  } catch {
    return undefined;
  }
}

export { posthog };
