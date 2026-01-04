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
  sales: { id: '2', name: 'Amjad', role: 'sales' }, // Using actual salesperson name
  pricing: { id: '3', name: 'Pricing Analyst', role: 'pricing' },
  ops: { id: '4', name: 'Operations Staff', role: 'ops' },
  collections: { id: '5', name: 'Collections Agent', role: 'collections' },
  finance: { id: '6', name: 'Finance Manager', role: 'finance' },
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
