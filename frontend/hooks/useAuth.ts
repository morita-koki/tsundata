'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi, type User } from '@/lib/api';
import type { LoadingState } from '@/types/common';

interface AuthState extends LoadingState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  syncUser: () => Promise<void>;
  updateProfile: (username: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const router = useRouter();

  // ローカルストレージからユーザー情報を取得
  const loadUserFromStorage = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setAuthState(prev => ({ ...prev, user }));
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      localStorage.removeItem('user');
    }
  }, []);

  // ユーザー情報をローカルストレージに保存
  const saveUserToStorage = useCallback((user: User) => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }, []);

  // Firebase認証状態の監視
  useEffect(() => {
    loadUserFromStorage();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthState(prev => ({ ...prev, firebaseUser, isLoading: true }));

      try {
        if (firebaseUser) {
          // Firebase認証成功時
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          
          // サーバーとユーザー情報を同期
          const userData = await authApi.syncUser();
          saveUserToStorage(userData);
          
          setAuthState(prev => ({
            ...prev,
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }));
        } else {
          // ログアウト状態
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          setAuthState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          }));
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication failed',
        }));
      }
    });

    return () => unsubscribe();
  }, [loadUserFromStorage, saveUserToStorage]);

  // ログイン（実装は各ページで行う）
  const login = useCallback(async (email: string, password: string) => {
    // この関数は各ページのログイン処理で使用される
    // 実際のFirebase認証は個別のページで実装
    throw new Error('Login implementation should be in login page');
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Logout failed',
        isLoading: false,
      }));
    }
  }, [router]);

  // ユーザー情報同期
  const syncUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const userData = await authApi.syncUser();
      saveUserToStorage(userData);
      
      setAuthState(prev => ({
        ...prev,
        user: userData,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('User sync error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to sync user data',
        isLoading: false,
      }));
    }
  }, [saveUserToStorage]);

  // プロフィール更新
  const updateProfile = useCallback(async (username: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const updatedUser = await authApi.updateProfile(username);
      saveUserToStorage(updatedUser);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Profile update error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to update profile',
        isLoading: false,
      }));
      throw error;
    }
  }, [saveUserToStorage]);

  return {
    ...authState,
    login,
    logout,
    syncUser,
    updateProfile,
  };
}