import { useState, useEffect, useCallback } from 'react';
import { webPushApi } from '../api/web-push';
import { toast } from 'sonner';

/**
 * Hook for managing PWA push notifications
 */
export const useWebPush = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  /**
   * Check if user is currently subscribed
   */
  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    console.log('🔔 Subscribe button clicked');

    if (!isSupported) {
      console.error('❌ Push notifications not supported');
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    console.log('✅ Browser supports push notifications');
    setIsLoading(true);

    try {
      console.log('📋 Requesting notification permission...');
      // Request permission
      const permissionResult = await Notification.requestPermission();
      console.log('📋 Permission result:', permissionResult);
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.error('❌ Permission denied by user');
        toast.error('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      console.log('🔑 Fetching VAPID public key from server...');
      // Get VAPID public key from server
      const vapidPublicKey = await webPushApi.getVapidPublicKey();
      console.log('✅ VAPID key received:', vapidPublicKey.substring(0, 20) + '...');

      console.log('⏳ Waiting for service worker to be ready...');
      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      console.log('📝 Creating push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      console.log('✅ Push subscription created');

      // Convert subscription to JSON
      const subscriptionJson = subscription.toJSON();
      console.log('📤 Sending subscription to backend...');

      // Send subscription to server
      await webPushApi.subscribe({
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh!,
          auth: subscriptionJson.keys!.auth!,
        },
      });
      console.log('✅ Subscription saved to backend');

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      setIsLoading(false);
      console.log('🎉 Push notifications enabled successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      toast.error('Failed to enable push notifications');
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from server
      await webPushApi.unsubscribe();

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to disable push notifications');
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus,
  };
};
