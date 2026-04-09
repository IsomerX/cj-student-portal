import { Suspense } from 'react';
import DayPassClient from './DayPassClient';

export default function DayPassPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fff7eb] p-5">
          <div className="flex flex-col items-center animate-pulse">
            <div className="h-16 w-16 rounded-full border-4 border-[#e5e5e5] border-t-[#414141] animate-spin mb-6" />
            <p className="text-lg font-bold text-[#414141]">Verifying your pass…</p>
          </div>
        </main>
      }
    >
      <DayPassClient />
    </Suspense>
  );
}
