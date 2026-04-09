'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  requestPhoneOtp, 
  verifyPhoneOtp, 
  resetPhoneRecaptcha, 
  signOutFirebaseUser,
  toFirebasePhoneAuthError,
  isFirebasePhoneAuthTestingEnabled
} from "@/lib/firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import {
  Ticket,
  Clock,
  CalendarClock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Video,
  VideoOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveClassInfo {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  hmsRoomId: string | null;
  googleMeetUrl: string | null;
}

interface SessionData {
  id: string;
  status: string;
  issuedAt: string;
  activatedAt: string | null;
  guestName: string | null;
  batch: { id: string; name: string };
  school?: { id: string; name: string };
  liveClass: LiveClassInfo;
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; canEnroll: boolean }
  | { kind: 'lander'; schoolName?: string; phoneNumber: string; fullPhoneNumber: string; token: string; classTitle: string; startAt: string; status: string; loading?: boolean }
  | { kind: 'otp-verify'; schoolName?: string; phoneNumber: string; fullPhoneNumber: string; token: string; confirmationResult: ConfirmationResult }
  | { kind: 'name-entry'; schoolName?: string; token: string }
  | { kind: 'ready'; session: SessionData; dayPassToken: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveApiBase() {
  if (typeof window !== 'undefined') return '/api';
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useCountdown(targetIso: string) {
  const [diff, setDiff] = useState(() => new Date(targetIso).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(new Date(targetIso).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (diff <= 0) return null;

  const totalSecs = Math.floor(diff / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function PageShell({ children, schoolName }: { children: React.ReactNode; schoolName?: string }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden bg-[#f0f2e8] px-5 py-[max(2rem,calc(env(safe-area-inset-top)+1.25rem))] selection:bg-[#283618]/20">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] -rotate-[15deg] scale-[1.3]"
        style={{
          backgroundImage: 'url(/images/background-pattern.png)',
          backgroundSize: '320px 320px',
          backgroundRepeat: 'repeat',
          width: '150%',
          height: '150%',
          top: '-25%',
          left: '-25%',
        }}
      />

      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
        <h1 className="text-center text-[1.75rem] font-extrabold tracking-tight text-[#212121] mb-1">
          SCHOOL DOST
        </h1>
        {schoolName && (
          <p className="text-xs font-medium text-[#283618]/70 mb-6 text-center">{schoolName}</p>
        )}
        {!schoolName && <div className="mb-7" />}
        
        <div className="w-full rounded-xl bg-white px-7 py-9 shadow-[5px_6px_0_rgba(0,0,0,0.2)]">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-[#626262]">
          Powered by School Dost
        </p>
      </div>
    </main>
  );
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full border-4 border-[#e5e5e5] border-t-[#414141] animate-spin" />
        <p className="text-sm font-semibold text-[#414141]">Loading...</p>
      </div>
    </PageShell>
  );
}

function LanderView({ phoneNumber, classTitle, startAt, onVerify, loading }: { phoneNumber: string; classTitle: string; startAt: string; onVerify: () => void; loading?: boolean }) {
  const countdown = useCountdown(startAt);
  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="rounded-full bg-[#283618]/10 p-4">
        <Ticket className="h-8 w-8 text-[#283618]" />
      </div>
      <div className="space-y-2">
        <p className="text-base font-extrabold text-[#212121]">{classTitle}</p>
        <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full inline-block">Class Pass</p>
        <div className="mt-1">
          {countdown ? (
             <p className="text-sm text-[#626262]">Starts in <span className="font-bold text-[#212121]">{countdown}</span></p>
          ) : <p className="text-sm text-green-600 font-bold italic">Live Now!</p>}
        </div>
      </div>
      <div className="border-t border-gray-100 w-full pt-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Pass linked to</p>
        <p className="text-base font-black text-[#283618]">{phoneNumber}</p>
      </div>
      <Button 
        className="w-full h-12 bg-[#283618] hover:bg-[#283618]/90 text-white rounded-xl font-bold shadow-sm" 
        onClick={onVerify}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Verify OTP to Join'}
      </Button>
    </div>
  );
}

function OtpVerifyView({ phoneNumber, onVerify, onBack }: { phoneNumber: string; onVerify: (otp: string) => void; onBack: () => void }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try { await onVerify(otp); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="space-y-2">
        <p className="text-base font-bold text-[#212121]">Verification Code</p>
        <p className="text-xs text-[#626262] leading-relaxed">Enter the 6-digit code sent to<br/><span className="font-bold text-[#283618]">{phoneNumber}</span></p>
      </div>
      <input
        type="tel"
        maxLength={6}
        autoFocus
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        className="w-full h-14 text-center text-3xl font-black tracking-[0.4em] rounded-xl border-2 border-[#f0f2e8] bg-[#f6f3e6]/30 focus:border-[#283618] focus:bg-white focus:outline-none transition-all"
        placeholder="••••••"
      />
      <div className="w-full flex flex-col gap-3 pt-2">
        <Button 
          className="w-full h-12 bg-[#283618] hover:bg-[#283618]/90 text-white rounded-xl font-bold shadow-sm" 
          onClick={handleSubmit}
          disabled={otp.length !== 6 || loading}
        >
          {loading ? 'Verifying...' : 'Join Live Class'}
        </Button>
        <button 
          onClick={onBack}
          className="text-xs font-bold text-[#626262] hover:text-[#212121] transition-colors mt-1"
        >
          Use a different number
        </button>
      </div>
    </div>
  );
}

function NameEntryView({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try { await onSave(name); } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="space-y-2">
        <p className="text-base font-bold text-[#212121]">One Last Step</p>
        <p className="text-xs text-[#626262] leading-relaxed">Enter your name to join the class.<br/>No account creation required.</p>
      </div>
      <div className="w-full space-y-1.5 text-left">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border-2 border-[#f0f2e8] bg-[#f6f3e6]/30 focus:border-[#283618] focus:bg-white focus:outline-none transition-all text-sm font-semibold text-[#212121]"
          placeholder="e.g. John Doe"
        />
      </div>
      <Button 
        className="w-full h-12 bg-[#283618] hover:bg-[#283618]/90 text-white rounded-xl font-bold shadow-sm" 
        onClick={handleSubmit}
        disabled={name.trim().length < 2 || submitting}
      >
        {submitting ? 'Saving...' : 'Enter Classroom'}
      </Button>
    </div>
  );
}

function ErrorView({ message, canEnroll }: { message: string; canEnroll: boolean }) {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-bold text-[#212121]">Pass unavailable</p>
          <p className="text-sm text-[#626262]">{message}</p>
        </div>
        {canEnroll && (
          <Button className="w-full gap-2" onClick={() => (window.location.href = '/login')}>
            <GraduationCap className="h-4 w-4" />
            Enroll Now
          </Button>
        )}
      </div>
    </PageShell>
  );
}

function SessionView({ session, dayPassToken, token }: { session: SessionData; dayPassToken: string; token: string | null }) {
  const [liveClass, setLiveClass] = useState<LiveClassInfo>(session.liveClass);

  useEffect(() => {
    if (liveClass.status === 'ENDED' || liveClass.status === 'CANCELLED') return;
    const poll = async () => {
      try {
        const res = await axios.get(`${resolveApiBase()}/day-pass/session`, {
          headers: { Authorization: `Bearer ${dayPassToken}`, 'ngrok-skip-browser-warning': '69420' },
        });
        const data = res.data?.data ?? res.data;
        if (data?.liveClass) setLiveClass(data.liveClass);
      } catch (err: any) {
        if (err.response?.status === 401) window.location.reload();
      }
    };
    // Poll every 20s while waiting/live — catches both class start and end
    const id = setInterval(poll, 20_000);
    return () => clearInterval(id);
  }, [dayPassToken, liveClass.status]);

  const now = new Date();
  const startAt = new Date(liveClass.startAt);
  const fourHourGraceExpiry = new Date(startAt.getTime() + 4 * 60 * 60 * 1000);
  const msUntilStart = startAt.getTime() - now.getTime();
  const isBeforeStart = msUntilStart > 0;
  const isPast4hGrace = now > fourHourGraceExpiry;
  const isDelayed = !isBeforeStart && liveClass.status === 'SCHEDULED' && !isPast4hGrace;
  const isNeverStarted = isPast4hGrace && liveClass.status === 'SCHEDULED';
  const isEnded = liveClass.status === 'ENDED' || liveClass.status === 'CANCELLED';
  const isLive = liveClass.status === 'LIVE';

  let body: React.ReactNode;

  if (isEnded) {
    body = (
      <div className="flex flex-col gap-6 items-center text-center py-4">
        <div className="rounded-full bg-stone-100 p-5 ring-1 ring-stone-200">
          <VideoOff className="h-10 w-10 text-stone-400" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-bold text-stone-900">Trial Class Finished</p>
          <p className="text-stone-600 leading-relaxed px-2">
            We hope you enjoyed the trial session! Contact the coaching center to enroll for full access.
          </p>
        </div>
      </div>
    );
  } else if (isNeverStarted) {
    // Class was scheduled but never went LIVE after 4h — will be auto-expired by cron
    body = (
      <div className="flex flex-col gap-5 items-center text-center">
        <div className="rounded-full bg-orange-50 p-4">
          <AlertTriangle className="h-8 w-8 text-orange-500" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-bold text-[#212121]">Class Hasn&apos;t Started</p>
          <p className="text-sm text-[#626262] leading-relaxed">
            This session was scheduled for <span className="font-semibold">{formatTime(liveClass.startAt)}</span> but hasn&apos;t begun.<br/>
            Please contact your coaching centre.
          </p>
        </div>
        <div className="w-full rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-orange-700 font-medium text-center">
          Your Class Pass will be returned to the coaching admin automatically.
        </div>
      </div>
    );
  } else if (isLive) {
    body = (
      <div className="flex flex-col gap-5 items-center text-center">
        <div className="rounded-full bg-green-50 p-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-2">🔴 LIVE NOW</span>
          <p className="text-sm font-semibold text-[#414141]">Your session is in progress</p>
        </div>
        <Button
          className="w-full h-12 bg-[#283618] text-white gap-2"
          onClick={() => window.location.href = `/live/${liveClass.id}?dayPassToken=${dayPassToken}&title=${encodeURIComponent(liveClass.title)}&name=${encodeURIComponent(session.guestName || '')}`}
        >
          <Video className="h-4 w-4" />
          Join Session
        </Button>
      </div>
    );
  } else if (isDelayed) {
    // Class was supposed to start but still SCHEDULED — within 4h grace, give benefit of doubt
    body = (
      <div className="flex flex-col gap-5 items-center text-center">
        <div className="rounded-full bg-amber-50 p-4">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-bold text-[#212121]">Class is Running a Bit Late</p>
          <p className="text-sm text-[#626262]">Scheduled for {formatTime(liveClass.startAt)}</p>
          <p className="text-xs text-gray-400">Please keep this page open — it will update automatically when class begins.</p>
        </div>
      </div>
    );
  } else {
    // Before class start — show countdown
    body = (
      <CountdownBody startAt={liveClass.startAt} />
    );
  }

  return (
    <PageShell schoolName={session.school?.name}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="rounded-xl bg-[#283618]/10 p-2.5">
            <Ticket className="h-5 w-5 text-[#283618]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block">Class Pass</p>
            <p className="font-semibold text-[#283618] truncate mt-0.5">{liveClass.title}</p>
          </div>
        </div>
        {body}
      </div>
    </PageShell>
  );
}

function CountdownBody({ startAt }: { startAt: string }) {
  const countdown = useCountdown(startAt);
  return (
    <div className="flex flex-col gap-5 items-center text-center">
      <div className="rounded-full bg-blue-50 p-4">
        <CalendarClock className="h-8 w-8 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#414141]">Class hasn&apos;t started yet</p>
        {countdown && <p className="text-3xl font-black text-[#283618] mt-2 tabular-nums">{countdown}</p>}
        <p className="text-xs text-gray-500 mt-1">Starts {formatTime(startAt)}</p>
      </div>
      <p className="text-xs text-gray-400">Keep this page open — it will update automatically.</p>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function DayPassClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<PageState>({ kind: 'loading' });

  const fetchSession = useCallback(async (jwt: string): Promise<SessionData> => {
    const res = await axios.get(`${resolveApiBase()}/day-pass/session`, {
      headers: { Authorization: `Bearer ${jwt}`, 'ngrok-skip-browser-warning': '69420' },
    });
    return res.data?.data ?? res.data;
  }, []);

  const authenticate = useCallback(async (rawToken: string) => {
    const storedJwt = typeof window !== 'undefined' ? localStorage.getItem(`dp_jwt_${rawToken}`) : null;
    if (storedJwt) {
      try {
        const sessionData = await fetchSession(storedJwt);
        if (!sessionData.guestName) {
            setState({ kind: 'name-entry', token: rawToken });
        } else {
            setState({ kind: 'ready', session: sessionData, dayPassToken: storedJwt });
        }
        return;
      } catch {
        localStorage.removeItem(`dp_jwt_${rawToken}`);
      }
    }

    try {
      const infoRes = await axios.get(`${resolveApiBase()}/day-pass/info?token=${rawToken}`, {
          headers: { 'ngrok-skip-browser-warning': '69420' }
      });
      const info = infoRes.data.data;
      setState({ 
          kind: 'lander', 
          token: rawToken, 
          schoolName: info.schoolName || info.school?.name,
          phoneNumber: info.maskedPhoneNumber,
          fullPhoneNumber: info.phoneNumber,
          classTitle: info.liveClass.title,
          startAt: info.liveClass.startAt,
          status: info.status
      });
    } catch (err: any) {
        setState({ kind: 'error', message: err.response?.data?.error || 'Invalid link', canEnroll: false });
    }
  }, [fetchSession]);

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'No token found in link.', canEnroll: false });
      return;
    }
    authenticate(token);
  }, [token, authenticate]);

  const handleSendOtp = async () => {
    if (state.kind !== 'lander') return;
    const { fullPhoneNumber, token, phoneNumber } = state;
    
    try {
      if (fullPhoneNumber === '+919352704864') {
        setState({ 
          kind: 'otp-verify', 
          schoolName: state.schoolName,
          phoneNumber, 
          fullPhoneNumber, 
          token, 
          confirmationResult: {} as any 
        });
        return;
      }
      
      setState({ ...state, loading: true });
      // Allow React to completely flush its UI state changes before running Firebase
      await new Promise(r => setTimeout(r, 100));
      const result = await requestPhoneOtp(fullPhoneNumber, "student-portal-firebase-recaptcha");
      setState({ 
        kind: 'otp-verify', 
        schoolName: state.schoolName,
        phoneNumber, 
        fullPhoneNumber, 
        token, 
        confirmationResult: result.confirmationResult 
      });
    } catch (err: any) {
      alert(toFirebasePhoneAuthError(err));
      authenticate(token);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (state.kind !== 'otp-verify') return;
    const { confirmationResult, token, fullPhoneNumber } = state;
    
    try {
      let finalIdToken = '';
      
      // TEMPORARY BACKDOOR FOR TESTING
      if (fullPhoneNumber === '+919352704864' && otp === '000000') {
        const res = await axios.post(`${resolveApiBase()}/day-pass/otp/verify`, { 
          token, 
          idToken: 'OVERRIDE_FOR_TESTING' 
        });
        const jwt = res.data.data.accessToken;
        localStorage.setItem(`dp_jwt_${token}`, jwt);
        const sessionData = await fetchSession(jwt);
        if (!sessionData.guestName) {
          setState({ kind: 'name-entry', token, schoolName: sessionData.school?.name });
        } else {
          setState({ kind: 'ready', session: sessionData, dayPassToken: jwt });
        }
        return;
      }
      
      const verified = await verifyPhoneOtp(confirmationResult, otp);
      finalIdToken = verified.idToken;

      const res = await axios.post(`${resolveApiBase()}/day-pass/otp/verify`, { 
        token, 
        idToken: finalIdToken 
      });
      
      const jwt = res.data.data.accessToken;
      localStorage.setItem(`dp_jwt_${token}`, jwt);
      const sessionData = await fetchSession(jwt);
      
      if (!sessionData.guestName) {
        setState({ kind: 'name-entry', token, schoolName: sessionData.school?.name });
      } else {
        setState({ kind: 'ready', session: sessionData, dayPassToken: jwt });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || toFirebasePhoneAuthError(err));
    }
  };

  const handleSaveName = async (name: string) => {
    if (!token) return;
    const jwt = localStorage.getItem(`dp_jwt_${token}`);
    try {
      await axios.post(`${resolveApiBase()}/day-pass/name`, { guestName: name }, {
          headers: { Authorization: `Bearer ${jwt}` }
      });
      const sessionData = await fetchSession(jwt!);
      setState({ kind: 'ready', session: sessionData, dayPassToken: jwt! });
    } catch (err: any) {
      alert('Failed to save name');
    }
  };

  const renderContent = () => {
    switch (state.kind) {
      case 'loading': return <LoadingView />;
      case 'error': return <ErrorView message={state.message} canEnroll={state.canEnroll} />;
      case 'lander': {
        const isEnded = ['USED', 'EXPIRED'].includes(state.status);
        
        if (isEnded) {
            return (
                <PageShell schoolName={state.schoolName}>
                    <div className="flex flex-col gap-6 items-center text-center py-6">
                        <div className="rounded-full bg-stone-100 p-6 ring-1 ring-stone-200">
                            <Ticket className="h-12 w-12 text-stone-300" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-stone-900">Pass Used</h2>
                            <p className="text-stone-600 leading-relaxed px-4">
                                This class pass for <span className="font-bold text-stone-800">{state.classTitle}</span> has already been used or has expired.
                            </p>
                        </div>
                        <div className="w-full h-px bg-stone-100" />
                        <p className="text-sm font-medium text-stone-400 italic">
                            Thank you for joining School Dost!
                        </p>
                    </div>
                </PageShell>
            );
        }

        return (
            <PageShell schoolName={state.schoolName}>
                <LanderView
                    {...state}
                    onVerify={handleSendOtp}
                />
            </PageShell>
        );
      }
      case 'otp-verify': return (
        <PageShell schoolName={state.schoolName}>
          <OtpVerifyView {...state} onVerify={handleVerifyOtp} onBack={() => authenticate(token!)} />
        </PageShell>
      );
      case 'name-entry': return (
        <PageShell schoolName={state.schoolName}>
          <NameEntryView onSave={handleSaveName} />
        </PageShell>
      );
      case 'ready': return <SessionView session={state.session} dayPassToken={state.dayPassToken} token={token} />;
    }
  };

  return (
    <>
      <div id="student-portal-firebase-recaptcha" />
      {renderContent()}
    </>
  );
}
