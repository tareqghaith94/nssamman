import { cn } from '@/lib/utils';
import { ShipmentStage } from '@/types/shipment';

interface StatusBadgeProps {
  stage: ShipmentStage;
  className?: string;
}

const stageConfig: Record<ShipmentStage, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'status-pending' },
  pricing: { label: 'Pricing', className: 'status-active' },
  operations: { label: 'In Operations', className: 'status-active' },
  completed: { label: 'Completed', className: 'status-completed' },
};

export function StatusBadge({ stage, className }: StatusBadgeProps) {
  const config = stageConfig[stage];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
