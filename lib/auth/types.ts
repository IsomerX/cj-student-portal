export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  schoolId?: string;
  mustResetPassword?: boolean;
  isProfileComplete?: boolean;
  classSection?: {
    grade?: number;
    section?: string;
  } | null;
  school?: {
    id: string;
    name: string;
    institutionType?: string;
  } | null;
  [key: string]: unknown;
}

export interface AuthSession {
  token: string;
  user: AuthUser | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface VerifyEmailOtpPayload {
  email: string;
  otp: string;
}
