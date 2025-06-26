'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { usePageTitle } from '@/contexts/PageContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isSidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();
  const { pageTitle } = usePageTitle();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get fresh token and store it
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          setIsLoading(false);
        } catch (error) {
          console.error('Auth state change error:', error);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation 
        title={pageTitle} 
        onMenuClick={toggleSidebar} 
      />
      
      <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-80' : 'lg:pl-0'}`}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}