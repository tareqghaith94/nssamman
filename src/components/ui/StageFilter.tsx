import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Filter, History } from 'lucide-react';

interface StageFilterProps {
  showHistory: boolean;
  onToggle: (showHistory: boolean) => void;
}

export function StageFilter({ showHistory, onToggle }: StageFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={showHistory ? 'history' : 'current'}
      onValueChange={(value) => {
        if (value) onToggle(value === 'history');
      }}
      className="border border-border rounded-lg"
    >
      <ToggleGroupItem value="current" aria-label="Show current only" className="gap-2 px-4">
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Current</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="history" aria-label="Show all history" className="gap-2 px-4">
        <History className="h-4 w-4" />
        <span className="hidden sm:inline">All History</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
