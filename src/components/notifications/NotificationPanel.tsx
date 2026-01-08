import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notification';
import { cn } from '@/lib/utils';
import { Package, ArrowRight, RefreshCw, CreditCard, FileText, CheckCheck, ShieldAlert, Receipt, DollarSign } from 'lucide-react';

const typeIcons: Record<NotificationType, React.ElementType> = {
  stage_change: ArrowRight,
  assignment: Package,
  update: RefreshCw,
  payment: CreditCard,
  quotation: FileText,
  admin_edit: ShieldAlert,
  payables_update: Receipt,
  collections_update: DollarSign,
};

const typeColors: Record<NotificationType, string> = {
  stage_change: 'text-blue-500',
  assignment: 'text-purple-500',
  update: 'text-amber-500',
  payment: 'text-green-500',
  quotation: 'text-cyan-500',
  admin_edit: 'text-red-500',
  payables_update: 'text-orange-500',
  collections_update: 'text-emerald-500',
};

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, unreadCount, isLoading } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.shipmentId) {
      // Navigate to the relevant page based on type
      switch (notification.type) {
        case 'stage_change':
        case 'assignment':
        case 'update':
        case 'admin_edit':
          navigate('/operations');
          break;
        case 'payment':
        case 'collections_update':
          navigate('/collections');
          break;
        case 'quotation':
          navigate('/quotations');
          break;
        case 'payables_update':
          navigate('/payables');
          break;
        default:
          navigate('/');
      }
    }
    
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      "hover:bg-muted/50",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "flex-shrink-0 mt-0.5",
                        typeColors[notification.type]
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            !notification.read && "text-foreground",
                            notification.read && "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
