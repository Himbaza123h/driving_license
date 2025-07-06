"use client";
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag when loading state changes
    if (isLoading) {
      hasRedirectedRef.current = false;
      return;
    }    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Define public (non-protected) routes for unauthenticated users
    const publicRoutes = ['/', '/auth'];
    const isPublicRoute = publicRoutes.includes(pathname || '');

    if (!user && !isPublicRoute) {
      // User not authenticated, redirect to auth
      hasRedirectedRef.current = true;
      router.replace('/auth');
    } else if (user && (pathname === '/auth' || pathname === '/')) {
      // User authenticated but on auth page or homepage, redirect to dashboard
      hasRedirectedRef.current = true;
      router.replace('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  return { user, isLoading, isRedirecting: hasRedirectedRef.current };
};
