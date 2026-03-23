'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useWebPush } from '@/lib/hooks/useWebPush';

/**
 * Prompt component to request push notification permission
 * Shows automatically after login if user hasn't granted permission yet
 */
export default function PushNotificationPrompt() {
  const { permission, isSubscribed, isSupported, subscribe } = useWebPush();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pushPromptDismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Show prompt if:
    // - Push notifications are supported
    // - User hasn't granted permission yet
    // - User hasn't subscribed
    // - User hasn't dismissed in last 7 days
    if (
      isSupported &&
      permission === 'default' &&
      !isSubscribed &&
      dismissedTime < sevenDaysAgo
    ) {
      // Show after 5 seconds to not be intrusive
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, isSubscribed]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pushPromptDismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="rounded-lg bg-white p-4 shadow-xl ring-1 ring-black/5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-blue-100 p-2">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Enable notifications
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Get instant alerts for live classes, assignments, and important updates.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleEnable}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
