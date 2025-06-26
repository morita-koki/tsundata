'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface NavigationProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function Navigation({ title, onMenuClick }: NavigationProps) {
  const [user, setUser] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for Firebase auth state changes to get profile photo
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
    });

    return () => unsubscribe();
  }, []);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('サインアウト中にエラーが発生しました:', error);
    }
  };

  const navigationItems: any[] = [];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav 
      id="main-nav"
      className="bg-white fixed top-0 left-0 right-0 z-50 border-b border-gray-300"
    >
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-3">
            {/* Menu button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <a href="/" className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">📚</span>
              <span className="ml-2 text-lg font-bold text-gray-900">つんでーた</span>
            </a>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex space-x-2">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center text-sm rounded-lg bg-gray-100 hover:bg-gray-200 px-2 py-1.5 transition-colors"
              >
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={firebaseUser.displayName || user?.username || 'ユーザー'}
                    className="w-6 h-6 rounded-full mr-1.5"
                  />
                ) : (
                  <span className="mr-1.5">👤</span>
                )}
                <span className="hidden sm:block font-medium text-sm">
                  {firebaseUser?.displayName || user?.username || 'ユーザー'}
                </span>
                <span className="ml-1.5 text-xs">▼</span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    {firebaseUser?.email || user?.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    サインアウト
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Click outside to close menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
}