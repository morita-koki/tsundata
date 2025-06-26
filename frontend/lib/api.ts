import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Fallback to localStorage token if Firebase user is not ready
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
    // Try localStorage as fallback
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  description: string;
  pageCount: number;
  thumbnail: string;
  price: number;
}

export interface UserBook {
  id: number;
  isRead: boolean;
  addedAt: string;
  readAt: string | null;
  book: Book;
}

export interface Bookshelf {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
  books?: Array<{
    userBookId: number;
    addedAt: string;
    displayOrder: number;
    isRead: boolean;
    readAt: string | null;
    book: Book;
  }>;
}

export interface Stats {
  totalBooks: number;
  unreadBooks: number;
  readBooks: number;
  totalValue: number;
  unreadValue: number;
}

export const authApi = {
  syncUser: async () => {
    const response = await api.post('/auth/sync');
    return response.data;
  },

  updateProfile: async (username: string) => {
    const response = await api.patch('/auth/profile', { username });
    return response.data;
  },
};

export const bookApi = {
  searchByISBN: async (isbn: string): Promise<Book> => {
    const response = await api.get(`/books/search/${isbn}`);
    return response.data;
  },

  addToLibrary: async (bookId: number, isRead = false): Promise<UserBook> => {
    const response = await api.post('/books/add', { bookId, isRead });
    return response.data;
  },

  getLibrary: async (): Promise<UserBook[]> => {
    const response = await api.get('/books/library');
    return response.data;
  },

  updateReadStatus: async (userBookId: number, isRead: boolean): Promise<UserBook> => {
    const response = await api.patch(`/books/read/${userBookId}`, { isRead });
    return response.data;
  },

  removeFromLibrary: async (userBookId: number): Promise<void> => {
    const response = await api.delete(`/books/remove/${userBookId}`);
    return response.data;
  },
};

export const userApi = {
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  followUser: async (userId: number) => {
    const response = await api.post(`/users/follow/${userId}`);
    return response.data;
  },

  unfollowUser: async (userId: number) => {
    const response = await api.delete(`/users/unfollow/${userId}`);
    return response.data;
  },

  blockUser: async (userId: number) => {
    const response = await api.post(`/users/block/${userId}`);
    return response.data;
  },

  unblockUser: async (userId: number) => {
    const response = await api.delete(`/users/unblock/${userId}`);
    return response.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export const bookshelfApi = {
  create: async (name: string, description?: string, isPublic = false): Promise<Bookshelf> => {
    const response = await api.post('/bookshelves', { name, description, isPublic });
    return response.data;
  },

  getAll: async (): Promise<Bookshelf[]> => {
    const response = await api.get('/bookshelves');
    return response.data;
  },

  getPublic: async (): Promise<Bookshelf[]> => {
    const response = await api.get('/bookshelves/public');
    return response.data;
  },

  getById: async (id: number): Promise<Bookshelf> => {
    const response = await api.get(`/bookshelves/${id}`);
    return response.data;
  },

  addBook: async (bookshelfId: number, userBookId: number) => {
    const response = await api.post(`/bookshelves/${bookshelfId}/books`, { userBookId });
    return response.data;
  },

  updateVisibility: async (id: number, isPublic: boolean): Promise<Bookshelf> => {
    const response = await api.patch(`/bookshelves/${id}`, { isPublic });
    return response.data;
  },

  update: async (id: number, name: string, description?: string, isPublic?: boolean): Promise<Bookshelf> => {
    const response = await api.patch(`/bookshelves/${id}`, { name, description, isPublic });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/bookshelves/${id}`);
    return response.data;
  },

  removeBook: async (bookshelfId: number, userBookId: number): Promise<void> => {
    const response = await api.delete(`/bookshelves/${bookshelfId}/books/${userBookId}`);
    return response.data;
  },

  reorderBooks: async (bookshelfId: number, bookOrders: Array<{ userBookId: number; displayOrder: number }>): Promise<void> => {
    const response = await api.patch(`/bookshelves/${bookshelfId}/books/reorder`, { bookOrders });
    return response.data;
  },
};

export default api;