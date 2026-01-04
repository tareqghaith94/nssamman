import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { addDays, subDays } from 'date-fns';
import { SALESPERSON_REF_PREFIX } from '@/types/permissions';

interface ShipmentStore {
  shipments: Shipment[];
  addShipment: (shipment: Omit<Shipment, 'id' | 'referenceId' | 'createdAt' | 'stage'>) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  moveToStage: (id: string, stage: ShipmentStage) => void;
  getShipmentsByStage: (stage: ShipmentStage) => Shipment[];
  getPayables: () => { shipment: Shipment; reminderDate: Date }[];
  getCollections: () => { shipment: Shipment; dueDate: Date }[];
  getCommissions: () => { salesperson: string; shipments: Shipment[]; totalCommission: number }[];
}

// Helper function to generate reference ID using defined prefixes
const generateReferenceId = (salesperson: string, existingShipments: Shipment[]): string => {
  // Use the defined prefix mapping, fallback to first character
  const prefix = SALESPERSON_REF_PREFIX[salesperson] || salesperson.charAt(0).toUpperCase();
  const count = existingShipments.filter(s => s.salesperson === salesperson).length + 1;
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  return `${prefix}-${year}${month}-${count.toString().padStart(4, '0')}`;
};

export const useShipmentStore = create<ShipmentStore>()(
  persist(
    (set, get) => ({
      shipments: [],
      
      addShipment: (shipmentData) => {
        const id = crypto.randomUUID();
        const referenceId = generateReferenceId(shipmentData.salesperson, get().shipments);
        const newShipment: Shipment = {
          ...shipmentData,
          id,
          referenceId,
          stage: 'lead',
          createdAt: new Date(),
        };
        set((state) => ({ shipments: [...state.shipments, newShipment] }));
      },
      
      updateShipment: (id, updates) => {
        set((state) => ({
          shipments: state.shipments.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
      
      moveToStage: (id, stage) => {
        set((state) => ({
          shipments: state.shipments.map((s) =>
            s.id === id ? { ...s, stage, ...(stage === 'completed' ? { completedAt: new Date() } : {}) } : s
          ),
        }));
      },
      
      getShipmentsByStage: (stage) => {
        return get().shipments.filter((s) => s.stage === stage);
      },
      
      getPayables: () => {
        const shipments = get().shipments.filter(
          (s) => s.stage === 'operations' || s.stage === 'completed'
        );
        
        return shipments
          .filter((s) => s.agent && s.totalCost && !s.agentPaid)
          .map((s) => {
            const isExport = s.portOfLoading.toLowerCase().includes('aqaba');
            let reminderDate: Date;
            
            if (isExport && s.etd) {
              reminderDate = addDays(new Date(s.etd), 3);
            } else if (s.eta) {
              reminderDate = subDays(new Date(s.eta), 10);
            } else {
              reminderDate = new Date();
            }
            
            return { shipment: s, reminderDate };
          });
      },
      
      getCollections: () => {
        const shipments = get().shipments.filter(
          (s) => s.stage === 'completed' && s.completedAt && !s.paymentCollected
        );
        
        return shipments.map((s) => {
          const daysToAdd = parseInt(s.paymentTerms) || 0;
          const dueDate = addDays(new Date(s.completedAt!), daysToAdd);
          return { shipment: s, dueDate };
        });
      },
      
      getCommissions: () => {
        const collectedShipments = get().shipments.filter(
          (s) => s.stage === 'completed' && s.paymentCollected && s.totalProfit
        );
        
        const bySalesperson = collectedShipments.reduce((acc, s) => {
          if (!acc[s.salesperson]) {
            acc[s.salesperson] = [];
          }
          acc[s.salesperson].push(s);
          return acc;
        }, {} as Record<string, Shipment[]>);
        
        return Object.entries(bySalesperson).map(([salesperson, shipments]) => ({
          salesperson,
          shipments,
          totalCommission: shipments.reduce((sum, s) => sum + (s.totalProfit || 0) * 0.04, 0),
        }));
      },
    }),
    {
      name: 'shipment-storage',
      onRehydrateStorage: () => (state) => {
        // Rehydrate date fields that were serialized to strings
        if (state) {
          state.shipments = state.shipments.map(s => ({
            ...s,
            createdAt: new Date(s.createdAt),
            completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
            lostAt: s.lostAt ? new Date(s.lostAt) : undefined,
            etd: s.etd ? new Date(s.etd) : undefined,
            eta: s.eta ? new Date(s.eta) : undefined,
            terminalCutoff: s.terminalCutoff ? new Date(s.terminalCutoff) : undefined,
            gateInTerminal: s.gateInTerminal ? new Date(s.gateInTerminal) : undefined,
            doReleaseDate: s.doReleaseDate ? new Date(s.doReleaseDate) : undefined,
            paymentCollectedDate: s.paymentCollectedDate ? new Date(s.paymentCollectedDate) : undefined,
            agentPaidDate: s.agentPaidDate ? new Date(s.agentPaidDate) : undefined,
            agentInvoiceDate: s.agentInvoiceDate ? new Date(s.agentInvoiceDate) : undefined,
          }));
        }
      },
    }
  )
);
