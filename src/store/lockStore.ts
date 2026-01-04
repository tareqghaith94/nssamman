import { create } from 'zustand';

interface RecordLock {
  shipmentId: string;
  lockedBy: string;
  lockedAt: Date;
}

interface LockStore {
  locks: RecordLock[];
  acquireLock: (shipmentId: string, userId: string) => boolean;
  releaseLock: (shipmentId: string) => void;
  isLocked: (shipmentId: string) => boolean;
  getLocker: (shipmentId: string) => string | null;
  cleanExpiredLocks: () => void;
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const useLockStore = create<LockStore>((set, get) => ({
  locks: [],
  
  acquireLock: (shipmentId, userId) => {
    const { locks, cleanExpiredLocks, isLocked, getLocker } = get();
    
    // Clean expired locks first
    cleanExpiredLocks();
    
    // Check if already locked by someone else
    if (isLocked(shipmentId)) {
      const locker = getLocker(shipmentId);
      if (locker && locker !== userId) {
        return false;
      }
    }
    
    // Remove any existing lock for this shipment
    const filteredLocks = locks.filter((l) => l.shipmentId !== shipmentId);
    
    // Add new lock
    set({
      locks: [
        ...filteredLocks,
        { shipmentId, lockedBy: userId, lockedAt: new Date() },
      ],
    });
    
    return true;
  },
  
  releaseLock: (shipmentId) => {
    set((state) => ({
      locks: state.locks.filter((l) => l.shipmentId !== shipmentId),
    }));
  },
  
  isLocked: (shipmentId) => {
    const { locks } = get();
    const lock = locks.find((l) => l.shipmentId === shipmentId);
    
    if (!lock) return false;
    
    // Check if lock is expired
    const now = new Date().getTime();
    const lockTime = new Date(lock.lockedAt).getTime();
    
    return now - lockTime < LOCK_TIMEOUT_MS;
  },
  
  getLocker: (shipmentId) => {
    const { locks } = get();
    const lock = locks.find((l) => l.shipmentId === shipmentId);
    return lock?.lockedBy || null;
  },
  
  cleanExpiredLocks: () => {
    const now = new Date().getTime();
    set((state) => ({
      locks: state.locks.filter((l) => {
        const lockTime = new Date(l.lockedAt).getTime();
        return now - lockTime < LOCK_TIMEOUT_MS;
      }),
    }));
  },
}));
