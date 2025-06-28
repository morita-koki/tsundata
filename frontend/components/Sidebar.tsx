'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { bookshelfApi, Bookshelf } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { useInitialMinimumLoading } from '@/hooks/useMinimumLoading';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBookshelfName, setNewBookshelfName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const loadBookshelves = useCallback(async () => {
    try {
      const data = await bookshelfApi.getAll();
      setBookshelves(data);
    } catch (error) {
      console.error('Failed to load bookshelves:', error);
    }
  }, []);

  const isLoading = useInitialMinimumLoading(loadBookshelves, []);

  useEffect(() => {
    // Listen for bookshelf updates
    const handleBookshelfUpdate = () => {
      loadBookshelves();
    };

    window.addEventListener('bookshelfUpdated', handleBookshelfUpdate);

    return () => {
      window.removeEventListener('bookshelfUpdated', handleBookshelfUpdate);
    };
  }, [loadBookshelves]);

  const handleBookshelfClick = (bookshelfId: number) => {
    router.push(`/bookshelves/${bookshelfId}`);
    // Only close on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleHomeClick = () => {
    router.push('/');
    // Only close on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isBookshelfActive = (bookshelfId: number) => {
    return pathname === `/bookshelves/${bookshelfId}`;
  };

  const handleCreateBookshelf = async () => {
    const trimmedName = newBookshelfName.trim();
    if (!trimmedName || isCreating) {
      // Auto-cancel if empty or whitespace only
      setNewBookshelfName('');
      return;
    }

    setIsCreating(true);
    try {
      const newBookshelf = await bookshelfApi.create(trimmedName);
      
      // Update local state
      setBookshelves(prev => [...prev, newBookshelf]);
      
      // Reset form
      setNewBookshelfName('');
      setShowCreateForm(false);
      
      // Dispatch update event for other components
      window.dispatchEvent(new Event('bookshelfUpdated'));
      
      // Navigate to the new bookshelf
      router.push(`/bookshelves/${newBookshelf.id}`);
      
      // Close sidebar on mobile
      if (window.innerWidth < 1024) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create bookshelf:', error);
      alert('本棚の作成に失敗しました');
      setNewBookshelfName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputBlur = () => {
    if (newBookshelfName.trim()) {
      handleCreateBookshelf();
    } else {
      // Auto-cancel if empty
      setShowCreateForm(false);
      setNewBookshelfName('');
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setNewBookshelfName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger onBlur which will create the bookshelf
    } else if (e.key === 'Escape') {
      setNewBookshelfName('');
      setShowCreateForm(false);
      e.currentTarget.blur();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 h-full w-80 bg-white border-r border-gray-200 border-t border-gray-300 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-1">
              {/* Home */}
              <button
                onClick={handleHomeClick}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive('/')
                    ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-sm font-medium">ホーム</span>
              </button>

              {/* Bookshelves Header */}
              <div className="flex items-center justify-between px-3 py-3 mt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  本棚
                </h3>
                <button
                  onClick={handleShowCreateForm}
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                >
                  ＋ 新規作成
                </button>
              </div>

              {/* Bookshelves List */}
              {isLoading ? (
                <div className="px-3 py-2 space-y-2">
                  {/* Skeleton placeholders for bookshelf items */}
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="h-4 rounded animate-skeleton mb-1"></div>
                        <div className="h-3 rounded animate-skeleton w-12"></div>
                      </div>
                      <div className="w-2 h-2 rounded-full animate-skeleton"></div>
                    </div>
                  ))}
                </div>
              ) : bookshelves.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">本棚がありません</div>
              ) : (
                <div className="space-y-1">
                  {bookshelves.map((bookshelf) => (
                    <button
                      key={bookshelf.id}
                      onClick={() => handleBookshelfClick(bookshelf.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isBookshelfActive(bookshelf.id)
                          ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{bookshelf.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {bookshelf.books?.length || 0}冊
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${
                          bookshelf.isPublic ? 'bg-green-400' : 'bg-gray-400'
                        }`}></span>
                      </div>
                    </button>
                  ))}
                  
                  {/* Create New Bookshelf Input - Only show when showCreateForm is true */}
                  {showCreateForm && (
                    <div className="px-3 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={newBookshelfName}
                          onChange={(e) => setNewBookshelfName(e.target.value)}
                          onBlur={handleInputBlur}
                          onKeyDown={handleKeyDown}
                          placeholder="新しい本棚名を入力"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                          disabled={isCreating}
                          autoFocus
                        />
                        {isCreating && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
                            <LoadingSpinner size="sm" color="indigo" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              総書籍数: {bookshelves.reduce((sum, shelf) => sum + (shelf.books?.length || 0), 0)}冊
            </div>
          </div>
        </div>
      </div>
    </>
  );
}