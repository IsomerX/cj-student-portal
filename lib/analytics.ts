import { safePostHog } from '@/lib/posthog';

export const analytics = {
  // -- Login --
  trackLoginAttempted(method: 'email' | 'phone') {
    safePostHog((ph) => ph.capture('login_attempted', { method, portal: 'student' }));
  },
  trackLoginSucceeded(method: 'email' | 'phone' | 'otp') {
    safePostHog((ph) => ph.capture('login_succeeded', { method, portal: 'student' }));
  },
  trackLoginFailed(method: string, reason: string) {
    safePostHog((ph) => ph.capture('login_failed', { method, reason, portal: 'student' }));
  },
  trackOtpVerified(type: 'email' | 'phone') {
    safePostHog((ph) => ph.capture('otp_verified', { type, portal: 'student' }));
  },
  trackLogout() {
    safePostHog((ph) => ph.capture('logout', { portal: 'student' }));
  },

  // -- App Launch --
  trackAppLaunched() {
    safePostHog((ph) => ph.capture('app_launched', { portal: 'student' }));
  },
  trackDashboardLoaded(properties?: Record<string, any>) {
    safePostHog((ph) => ph.capture('dashboard_loaded', { portal: 'student', ...properties }));
  },

  // -- Live Classes --
  trackLiveClassJoined(classId: string, properties?: Record<string, any>) {
    safePostHog((ph) => ph.capture('live_class_joined', { class_id: classId, portal: 'student', ...properties }));
  },
  trackLiveClassLeft(classId: string, properties?: Record<string, any>) {
    safePostHog((ph) => ph.capture('live_class_left', { class_id: classId, portal: 'student', ...properties }));
  },
  trackCameraToggled(enabled: boolean) {
    safePostHog((ph) => ph.capture('camera_toggled', { enabled, portal: 'student' }));
  },
  trackMicToggled(enabled: boolean) {
    safePostHog((ph) => ph.capture('mic_toggled', { enabled, portal: 'student' }));
  },
  trackHandRaised() {
    safePostHog((ph) => ph.capture('hand_raised', { portal: 'student' }));
  },

  // -- Batches --
  trackBatchViewed(batchId: string, batchName?: string) {
    safePostHog((ph) => ph.capture('batch_viewed', { batch_id: batchId, batch_name: batchName, portal: 'student' }));
  },

  // -- Recordings --
  trackRecordingViewed(recordingId: string, properties?: Record<string, any>) {
    safePostHog((ph) => ph.capture('recording_viewed', { recording_id: recordingId, portal: 'student', ...properties }));
  },

  // -- Generic --
  track(eventName: string, properties?: Record<string, any>) {
    safePostHog((ph) => ph.capture(eventName, { portal: 'student', ...properties }));
  },

  identify(userId: string, traits?: Record<string, any>) {
    safePostHog((ph) => ph.identify(userId, { ...traits, portal: 'student' }));
  },

  reset() {
    safePostHog((ph) => ph.reset());
  },
};
