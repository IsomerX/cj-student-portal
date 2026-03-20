'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, safePostHog, POSTHOG_KEY } from '@/lib/posthog';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && POSTHOG_KEY) {
      initPostHog();
      initialized.current = true;

      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.id) {
            safePostHog((ph) =>
              ph.identify(user.id, {
                email: user.email,
                name: user.name,
                role: user.role,
                school_id: user.schoolId || user.school_id,
              })
            );
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !initialized.current) return;

    const url = window.origin + pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    safePostHog((ph) =>
      ph.capture('$pageview', {
        $current_url: url,
        path: pathname,
      })
    );
  }, [pathname, searchParams]);

  return <>{children}</>;
}
