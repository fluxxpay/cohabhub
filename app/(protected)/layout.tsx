'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ScreenLoader } from '@/components/common/screen-loader';
import { Demo1Layout } from '../components/layouts/demo1/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (!user) {
    return null;
  }

  // Ne pas appliquer Demo1Layout aux routes admin (elles ont leur propre layout)
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return <Demo1Layout>{children}</Demo1Layout>;
}
