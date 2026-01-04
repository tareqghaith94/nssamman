import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActivityLog, ActivityType } from '@/types/activity';

interface ActivityStore {
  activities: ActivityLog[];
  addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  getActivitiesByShipment: (shipmentId: string) => ActivityLog[];
  getAllActivities: () => ActivityLog[];
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      
      addActivity: (activity) => {
        const newActivity: ActivityLog = {
          ...activity,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities],
        }));
      },
      
      getActivitiesByShipment: (shipmentId) => {
        return get().activities.filter((a) => a.shipmentId === shipmentId);
      },
      
      getAllActivities: () => {
        return get().activities;
      },
      
      clearActivities: () => {
        set({ activities: [] });
      },
    }),
    {
      name: 'activity-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activities = state.activities.map((a) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }));
        }
      },
    }
  )
);
