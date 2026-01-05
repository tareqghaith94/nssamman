import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground",
            "text-xs font-medium flex items-center justify-center"
          )}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
