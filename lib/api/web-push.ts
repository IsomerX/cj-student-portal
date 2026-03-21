import { apiClient } from './config';

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Web Push API Client
 * For managing PWA push notification subscriptions
 */
export const webPushApi = {
  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey: async (): Promise<string> => {
    const response = await apiClient.get('/web-push/vapid-public-key');
    return response.data.data.publicKey;
  },

  /**
   * Save push subscription to backend
   */
  subscribe: async (subscription: WebPushSubscription): Promise<void> => {
    await apiClient.post('/web-push/subscribe', { subscription });
  },

  /**
   * Remove push subscription from backend
   */
  unsubscribe: async (): Promise<void> => {
    await apiClient.post('/web-push/unsubscribe');
  },
};
