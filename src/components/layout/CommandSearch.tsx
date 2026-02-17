import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShipments } from '@/hooks/useShipments';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Users, Calculator, Truck, CheckCircle, Search } from 'lucide-react';

const stageIcons: Record<string, typeof Users> = {
  lead: Users,
  pricing: Calculator,
  operations: Truck,
  completed: CheckCircle,
};

const stageRoutes: Record<string, string> = {
  lead: '/leads',
  pricing: '/pricing',
  operations: '/operations',
  completed: '/operations',
};

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { shipments } = useShipments();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (shipmentId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (shipment) {
      const route = stageRoutes[shipment.stage] || '/leads';
      navigate(route);
    }
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search shipments by reference, client, or salesperson..." />
      <CommandList>
        <CommandEmpty>No shipments found.</CommandEmpty>
        <CommandGroup heading="Shipments">
          {shipments.slice(0, 50).map((shipment) => {
            const Icon = stageIcons[shipment.stage] || Search;
            return (
              <CommandItem
                key={shipment.id}
                value={`${shipment.referenceId} ${shipment.clientName || ''} ${shipment.salesperson}`}
                onSelect={() => handleSelect(shipment.id)}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{shipment.referenceId}</span>
                <span className="ml-2 text-muted-foreground text-sm">
                  {shipment.clientName || shipment.salesperson}
                </span>
                <span className="ml-auto text-xs text-muted-foreground capitalize">
                  {shipment.stage}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
