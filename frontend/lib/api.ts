import axios from 'axios';
import { auth } from './firebase';
import type {
  User,
  Book,
  UserBook,
  BookshelfBook,
  Bookshelf,
  BookshelfDetailResponse,
  Stats
} from '@/types/api';

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

// Re-export types for backward compatibility
export type {
  User,
  Book,
  UserBook,
  BookshelfBook,
  Bookshelf,
  Stats
} from '@/types/api';

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

  addToLibrary: async (isbn: string): Promise<UserBook> => {
    const response = await api.post('/books/library', { isbn });
    return response.data;
  },

  getLibrary: async (): Promise<UserBook[]> => {
    const response = await api.get('/books/library');
    return response.data.data; // Extract the array from paginated response
  },

  updateReadStatus: async (userBookId: number, isRead: boolean): Promise<UserBook> => {
    const response = await api.put(`/books/library/${userBookId}/status`, { isRead });
    return response.data;
  },

  removeFromLibrary: async (isbn: string): Promise<void> => {
    const response = await api.delete(`/books/library/${isbn}`);
    return response.data;
  },
};

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data.data; // Extract the data from success response
  },

  getStats: async (): Promise<Stats> => {
    const response = await api.get('/users/me/stats');
    return response.data.data; // Extract the data from success response
  },

  followUser: async (userId: number) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId: number) => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  blockUser: async (userId: number) => {
    const response = await api.post(`/users/${userId}/block`);
    return response.data;
  },

  unblockUser: async (userId: number) => {
    const response = await api.delete(`/users/${userId}/block`);
    return response.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.data; // Extract the array from paginated response
  },
};

export const bookshelfApi = {
  create: async (name: string, description?: string, isPublic = false): Promise<Bookshelf> => {
    const response = await api.post('/bookshelves', { name, description, isPublic });
    return response.data.data; // Extract the data from success response
  },

  getAll: async (): Promise<Bookshelf[]> => {
    const response = await api.get('/bookshelves');
    return response.data.data; // Extract the array from paginated response
  },

  getPublic: async (): Promise<Bookshelf[]> => {
    const response = await api.get('/bookshelves/public');
    return response.data.data; // Extract the array from paginated response
  },

  getById: async (id: number): Promise<Bookshelf> => {
    const response = await api.get(`/bookshelves/${id}`);
    return response.data.data; // Extract the data from success response
  },

  getWithBooks: async (id: number): Promise<BookshelfDetailResponse> => {
    const response = await api.get(`/bookshelves/${id}/books`);
    return response.data.data; // Extract the data from success response
  },

  addBook: async (bookshelfId: number, userBookId: number) => {
    const response = await api.post(`/bookshelves/${bookshelfId}/books`, { userBookId });
    return response.data.data; // Extract the data from success response
  },

  updateVisibility: async (id: number, isPublic: boolean): Promise<Bookshelf> => {
    const response = await api.put(`/bookshelves/${id}`, { isPublic });
    return response.data.data; // Extract the data from success response
  },

  update: async (id: number, name: string, description?: string, isPublic?: boolean): Promise<Bookshelf> => {
    const response = await api.put(`/bookshelves/${id}`, { name, description, isPublic });
    return response.data.data; // Extract the data from success response
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