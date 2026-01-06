import { Users, User } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface OpsOwnerFilterProps {
  showMine: boolean;
  onToggle: (showMine: boolean) => void;
}

export function OpsOwnerFilter({ showMine, onToggle }: OpsOwnerFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={showMine ? 'mine' : 'all'}
      onValueChange={(value) => {
        if (value) onToggle(value === 'mine');
      }}
      className="bg-muted rounded-md p-1"
    >
      <ToggleGroupItem
        value="all"
        aria-label="Show all shipments"
        className="data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm"
      >
        <Users className="h-4 w-4 mr-1.5" />
        All
      </ToggleGroupItem>
      <ToggleGroupItem
        value="mine"
        aria-label="Show my shipments"
        className="data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm"
      >
        <User className="h-4 w-4 mr-1.5" />
        Mine
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
