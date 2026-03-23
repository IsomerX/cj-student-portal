/**
 * Payment API Client - Student Portal
 */

import { apiClient } from './client';

export interface CreatePaymentOrderRequest {
  schoolId: string;
  amount: number;
  description: string;
  studentEmail?: string;
  studentPhone?: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  schoolAmount: number;
  platformFee: number;
  razorpayKeyId: string;
}

export const paymentApi = {
  /**
   * Create payment order for fee payment
   */
  async createPaymentOrder(data: CreatePaymentOrderRequest): Promise<{ success: boolean; data: PaymentOrderResponse }> {
    const response = await apiClient.post('/schools/payment/create-order', data);
    return response.data;
  },

  /**
   * Verify payment after successful Razorpay checkout
   */
  async verifyPayment(orderId: string, paymentId: string, signature: string, invoiceId?: string) {
    const response = await apiClient.post('/schools/payment/verify', {
      orderId,
      paymentId,
      signature,
      invoiceId,
    });
    return response.data;
  },
};
