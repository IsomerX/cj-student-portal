import { apiClient } from './config';

export type BatchAccessStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type BillingFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface MyCoachingEnrollment {
  id: string;
  schoolId: string;
  batchId: string;
  accessStatus: BatchAccessStatus;
  billingFrequency: BillingFrequency;
  nextBillingDate: string | null;
  enrolledAt: string;
  school: { id: string; name: string } | null;
  batch: { id: string; name: string } | null;
}

/**
 * Get the logged-in student's coaching enrollments.
 * GET /api/coaching/my-enrollments
 */
export async function getMyCoachingEnrollments(): Promise<MyCoachingEnrollment[]> {
  const response = await apiClient.get('/coaching/my-enrollments');
  return response.data || [];
}
