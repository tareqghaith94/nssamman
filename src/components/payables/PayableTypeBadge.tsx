import { Badge } from '@/components/ui/badge';
import { PartyType, PARTY_TYPE_LABELS, PARTY_TYPE_ICONS } from '@/types/payable';
import { cn } from '@/lib/utils';

interface PayableTypeBadgeProps {
  type: PartyType;
  className?: string;
}

const typeColors: Record<PartyType, string> = {
  agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  shipping_line: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  land_transport: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  customs_broker: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export function PayableTypeBadge({ type, className }: PayableTypeBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn('font-normal', typeColors[type], className)}
    >
      <span className="mr-1">{PARTY_TYPE_ICONS[type]}</span>
      {PARTY_TYPE_LABELS[type]}
    </Badge>
  );
}
