"use client";

import * as React from "react";

interface GrecaptchaInstance {
  render: (
    container: HTMLElement,
    parameters: {
      sitekey: string;
    },
  ) => number;
  ready: (callback: () => void) => void;
  getResponse: (widgetId?: number) => string;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaInstance;
    __studentPortalRecaptchaOnLoad?: () => void;
  }
}

const RECAPTCHA_SCRIPT_ID = "student-portal-recaptcha-script";

export function useRecaptcha(siteKey?: string) {
  const [isReady, setIsReady] = React.useState(false);
  const widgetIdRef = React.useRef<number | null>(null);

  const isEnabled = Boolean(siteKey);

  const renderWidget = React.useCallback(() => {
    if (!isEnabled || !siteKey) return;

    const container = document.getElementById("student-portal-recaptcha");
    if (!container || !window.grecaptcha?.render) return;
    if (widgetIdRef.current !== null) return;

    try {
      widgetIdRef.current = window.grecaptcha.render(container, { sitekey: siteKey });
      setIsReady(true);
    } catch {
      container.innerHTML = "";

      try {
        widgetIdRef.current = window.grecaptcha.render(container, { sitekey: siteKey });
        setIsReady(true);
      } catch (error) {
        console.error("reCAPTCHA render failed:", error);
      }
    }
  }, [isEnabled, siteKey]);

  React.useEffect(() => {
    if (!isEnabled) {
      setIsReady(true);
      return;
    }

    window.__studentPortalRecaptchaOnLoad = () => {
      renderWidget();
    };

    if (window.grecaptcha?.render) {
      window.grecaptcha.ready(() => {
        renderWidget();
      });
      return;
    }

    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = RECAPTCHA_SCRIPT_ID;
      script.src =
        "https://www.google.com/recaptcha/api.js?onload=__studentPortalRecaptchaOnLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      widgetIdRef.current = null;
    };
  }, [isEnabled, renderWidget]);

  const getToken = React.useCallback(() => {
    if (!isEnabled) return undefined;
    if (!window.grecaptcha) return undefined;

    return window.grecaptcha.getResponse(widgetIdRef.current ?? undefined) || undefined;
  }, [isEnabled]);

  const reset = React.useCallback(() => {
    if (!isEnabled) return;
    window.grecaptcha?.reset(widgetIdRef.current ?? undefined);
  }, [isEnabled]);

  return {
    isEnabled,
    isReady,
    getToken,
    reset,
  };
}
