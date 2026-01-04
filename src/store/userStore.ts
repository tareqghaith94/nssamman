import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/permissions';

interface UserStore {
  currentUser: User;
  setRole: (role: UserRole) => void;
  setUser: (user: User) => void;
}

// Mock users for testing
export const MOCK_USERS: Record<UserRole, User> = {
  admin: { id: '1', name: 'Admin User', role: 'admin' },
  sales: { id: '2', name: 'Sales Rep', role: 'sales' },
  finance: { id: '3', name: 'Finance Manager', role: 'finance' },
  operations: { id: '4', name: 'Operations Staff', role: 'operations' },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      currentUser: MOCK_USERS.admin, // Default to admin for testing
      
      setRole: (role) => {
        set({ currentUser: MOCK_USERS[role] });
      },
      
      setUser: (user) => {
        set({ currentUser: user });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
