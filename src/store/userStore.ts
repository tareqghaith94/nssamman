import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/permissions';

interface UserStore {
  currentUser: User;
  setRole: (role: UserRole) => void;
  setUser: (user: User) => void;
}

// Mock users for testing - each salesperson has their ref prefix
export const MOCK_USERS: Record<UserRole, User> = {
  admin: { id: '1', name: 'Admin User', role: 'admin' },
  sales: { id: '2', name: 'Amjad', role: 'sales', refPrefix: 'A' }, // Amjad's ref prefix
  pricing: { id: '3', name: 'Pricing Analyst', role: 'pricing' },
  ops: { id: '4', name: 'Operations Staff', role: 'ops' },
  collections: { id: '5', name: 'Collections Agent', role: 'collections' },
  finance: { id: '6', name: 'Finance Manager', role: 'finance' },
};

// All salespeople as mock users for role switching
export const SALES_USERS: User[] = [
  { id: '2', name: 'Amjad', role: 'sales', refPrefix: 'A' },
  { id: '7', name: 'Tareq', role: 'sales', refPrefix: 'T' },
  { id: '8', name: 'Mozayan', role: 'sales', refPrefix: 'M' },
  { id: '9', name: 'Rania', role: 'sales', refPrefix: 'R' },
  { id: '10', name: 'Sanad', role: 'sales', refPrefix: 'S' },
  { id: '11', name: 'Uma', role: 'sales', refPrefix: 'U' },
  { id: '12', name: 'Marwan', role: 'sales', refPrefix: 'MA' },
];

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
