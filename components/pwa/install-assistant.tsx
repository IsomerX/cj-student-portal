"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownToLine, Home, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_KEY = "cj_student_install_prompt_dismissed_until";
const DISMISS_MS = 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosNavigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function isIosMobile() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function shouldHideOnPath(pathname: string) {
  if (!pathname || pathname === "/login" || pathname.startsWith("/auth")) {
    return true;
  }

  if (/^\/live\/(?!recordings(?:\/|$))[^/]+$/.test(pathname)) {
    return true;
  }

  if (pathname.startsWith("/live/recordings/play")) {
    return true;
  }

  return false;
}

export default function InstallAssistant() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncStandalone = () => {
      setIsStandalone(isStandaloneMode());
      setIsIos(isIosMobile());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsDismissed(true);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    syncStandalone();

    const dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? "0");
    setIsDismissed(dismissedUntil > Date.now());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => syncStandalone();
    displayModeQuery.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
      displayModeQuery.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const dismissPrompt = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    }
    setIsDismissed(true);
  }, []);

  const handleInstall = React.useCallback(async () => {
    if (!deferredPrompt) {
      setIsInstructionsOpen(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsDismissed(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DISMISS_KEY);
      }
      return;
    }

    dismissPrompt();
  }, [deferredPrompt, dismissPrompt]);

  const showPrompt =
    !shouldHideOnPath(pathname) &&
    !isStandalone &&
    !isDismissed &&
    (Boolean(deferredPrompt) || isIos);

  if (!showPrompt) {
    return (
      <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
        <DialogContent className="max-w-md rounded-3xl border-[#ece5c8]">
          <DialogHeader>
            <DialogTitle>Add CJ Student to your Home Screen</DialogTitle>
            <DialogDescription>
              Install the student portal to open live classes without the normal mobile browser bars.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-[#414141]">
            <div className="rounded-2xl border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-[#212121]">
                <Share2 className="h-4 w-4" />
                Step 1
              </div>
              <p className="mt-1 text-[#5f5f5f]">
                Open the browser menu and tap <span className="font-semibold text-[#212121]">Share</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-[#212121]">
                <Home className="h-4 w-4" />
                Step 2
              </div>
              <p className="mt-1 text-[#5f5f5f]">
                Choose <span className="font-semibold text-[#212121]">Add to Home Screen</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-[#212121]">
                <ArrowDownToLine className="h-4 w-4" />
                Step 3
              </div>
              <p className="mt-1 text-[#5f5f5f]">
                Launch <span className="font-semibold text-[#212121]">CJ Student</span> from the Home Screen for the app-like view.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInstructionsOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href="/live">Open live classes</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <div
        className="fixed inset-x-3 z-[70] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
        style={{ bottom: "max(6rem, calc(env(safe-area-inset-bottom) + 4rem))" }}
      >
        <div className="rounded-[24px] border border-[#ece5c8] bg-white/95 p-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#737373]">
                Full-screen classes
              </p>
              <h3 className="mt-1 text-base font-extrabold text-[#212121]">
                Install CJ Student
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5f5f5f]">
                {deferredPrompt
                  ? "Open live classes like an app and keep the browser chrome out of the way."
                  : "Add CJ Student to your Home Screen to reduce browser bars during live classes."}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPrompt}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#f6f3eb] hover:text-[#212121]"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleInstall} className="rounded-full px-4">
              <ArrowDownToLine className="h-4 w-4" />
              {deferredPrompt ? "Install app" : "Show steps"}
            </Button>
            {!deferredPrompt && (
              <Button
                variant="outline"
                onClick={() => setIsInstructionsOpen(true)}
                className="rounded-full px-4"
              >
                <Share2 className="h-4 w-4" />
                Add to Home Screen
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
        <DialogContent className="max-w-md rounded-3xl border-[#ece5c8]">
          <DialogHeader>
            <DialogTitle>Add CJ Student to your Home Screen</DialogTitle>
            <DialogDescription>
              Install the student portal to open live classes without the normal mobile browser bars.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-[#414141]">
            <div className="rounded-2xl border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-[#212121]">
                <Share2 className="h-4 w-4" />
                Step 1
              </div>
              <p className="mt-1 text-[#5f5f5f]">
                Open the browser menu and tap <span className="font-semibold text-[#212121]">Share</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-[#212121]">
                <Home className="h-4 w-4" />
                Step 2
              </div>
              <p className="mt-1 text-[#5f5f5f]">
                Choose <span className="font-semibold text-[#212121]">Add to Home Screen</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-[#212121]">
                <ArrowDownToLine className="h-4 w-4" />
                Step 3
              </div>
              <p className="mt-1 text-[#5f5f5f]">
                Launch <span className="font-semibold text-[#212121]">CJ Student</span> from the Home Screen for the app-like view.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInstructionsOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href="/live">Open live classes</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
