import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, Truck, CreditCard, Banknote, Percent, ScrollText, Database, UserCog, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { canAccessPage } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import nssLogo from '@/assets/nss-logo.png';
import { UserRole } from '@/types/permissions';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users
  },
  {
    name: 'Pricing',
    href: '/pricing',
    icon: Calculator
  },
  {
    name: 'Operations',
    href: '/operations',
    icon: Truck
  },
  {
    name: 'Payables',
    href: '/payables',
    icon: CreditCard
  },
  {
    name: 'Collections',
    href: '/collections',
    icon: Banknote
  },
  {
    name: 'Commissions',
    href: '/commissions',
    icon: Percent
  },
  {
    name: 'Database',
    href: '/database',
    icon: Database
  },
  {
    name: 'Activity Log',
    href: '/activity-log',
    icon: ScrollText
  },
  {
    name: 'Users',
    href: '/users',
    icon: UserCog
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  }
];

export function Sidebar() {
  const location = useLocation();
  const {
    profile,
    roles,
    signOut
  } = useAuth();

  // Use roles array for multi-role support
  const userRoles = (roles || []) as UserRole[];

  // Filter navigation based on user roles
  const filteredNavigation = navigation.filter(item => userRoles.length > 0 ? canAccessPage(userRoles, item.href) : false);
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      // Force navigation to auth page
      window.location.href = '/auth';
    }
  };
  
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex h-60 items-center justify-center px-4 border-b border-sidebar-border">
        <img src={nssLogo} alt="NSS - National Shipping Services" className="h-56 w-auto object-contain rounded-sm" />
      </div>
      
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {filteredNavigation.map(item => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink 
              key={item.name} 
              to={item.href} 
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200', 
                isActive 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      {/* User info and sign out */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          {profile && (
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{profile.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRoles.length > 0 ? userRoles.join(', ') : profile.role}
              </p>
            </div>
          )}
          <NotificationBell />
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
