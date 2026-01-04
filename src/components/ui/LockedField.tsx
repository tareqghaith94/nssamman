import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LockedFieldProps {
  isLocked: boolean;
  lockReason?: string;
  children: ReactNode;
  className?: string;
}

export function LockedField({ isLocked, lockReason, children, className }: LockedFieldProps) {
  if (!isLocked) {
    return <>{children}</>;
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none opacity-60">
        {children}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-muted">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{lockReason || 'This field is locked'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
