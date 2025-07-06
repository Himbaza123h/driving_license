"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import DashboardHeader from './DashboardHeader';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
    // Handle redirects based on authentication status
  useEffect(() => {
    console.log('ConditionalLayout useEffect triggered');
    console.log('isLoading:', isLoading, 'user:', !!user, 'pathname:', pathname);
    
    if (!isLoading) {
      const publicRoutes = ['/', '/auth'];
      const isPublicRoute = publicRoutes.includes(pathname || '');

      if (!user && !isPublicRoute) {
        // User not authenticated, redirect to auth
        console.log('Redirecting unauthenticated user to /auth');
        router.replace('/auth');
      } else if (user && (pathname === '/auth' || pathname === '/')) {
        // User authenticated but on auth page or homepage, redirect to dashboard
        console.log('Redirecting authenticated user to /dashboard');
        router.replace('/dashboard');
      } else {
        console.log('No redirect needed');
      }
    }
  }, [user, isLoading, pathname, router]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is authenticated, show dashboard layout for all pages
  if (user) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }
    // For unauthenticated users, only show home header/footer on public pages
  const publicPages = ['/', '/auth'];
  const isPublicPage = publicPages.includes(pathname || '');
  
  if (!isPublicPage) {
    // Protected pages for unauthenticated users - show loading while redirect happens
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C8E5D] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }
  
  // Public pages get the full home layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default ConditionalLayout;
