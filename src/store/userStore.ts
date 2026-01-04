import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/permissions';

interface UserStoreUser extends User {
  roles: UserRole[]; // Multi-role support
}

interface UserStore {
  currentUser: UserStoreUser;
  setRole: (role: UserRole) => void;
  setRoles: (roles: UserRole[]) => void;
  setUser: (user: UserStoreUser) => void;
}

// Mock users for testing - each salesperson has their ref prefix
export const MOCK_USERS: Record<UserRole, UserStoreUser> = {
  admin: { id: '1', name: 'Admin User', role: 'admin', roles: ['admin'] },
  sales: { id: '2', name: 'Amjad', role: 'sales', refPrefix: 'A', roles: ['sales'] },
  pricing: { id: '3', name: 'Pricing Analyst', role: 'pricing', roles: ['pricing'] },
  ops: { id: '4', name: 'Operations Staff', role: 'ops', roles: ['ops'] },
  collections: { id: '5', name: 'Collections Agent', role: 'collections', roles: ['collections'] },
  finance: { id: '6', name: 'Finance Manager', role: 'finance', roles: ['finance'] },
};

// All salespeople as mock users for role switching
export const SALES_USERS: UserStoreUser[] = [
  { id: '2', name: 'Amjad', role: 'sales', refPrefix: 'A', roles: ['sales'] },
  { id: '7', name: 'Tareq', role: 'sales', refPrefix: 'T', roles: ['sales'] },
  { id: '8', name: 'Mozayan', role: 'sales', refPrefix: 'M', roles: ['sales'] },
  { id: '9', name: 'Rania', role: 'sales', refPrefix: 'R', roles: ['sales'] },
  { id: '10', name: 'Sanad', role: 'sales', refPrefix: 'S', roles: ['sales'] },
  { id: '11', name: 'Uma', role: 'sales', refPrefix: 'U', roles: ['sales'] },
  { id: '12', name: 'Marwan', role: 'sales', refPrefix: 'MA', roles: ['sales'] },
];

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      currentUser: MOCK_USERS.admin, // Default to admin for testing
      
      setRole: (role) => {
        set({ currentUser: MOCK_USERS[role] });
      },
      
      setRoles: (roles) => {
        set((state) => ({
          currentUser: { ...state.currentUser, roles }
        }));
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
