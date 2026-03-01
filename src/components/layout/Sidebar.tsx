import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, Truck, CreditCard, Banknote, Percent, ScrollText, Database, UserCog, LogOut, Settings, CalendarDays, Menu, X, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { canAccessPage } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import nssLogo from '@/assets/nss-logo.png';
import { UserRole } from '@/types/permissions';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const navigationGroups = [
  {
    label: 'Pipeline',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Leads', href: '/leads', icon: Users },
      { name: 'Telesales', href: '/telesales', icon: Headphones },
      { name: 'Pricing', href: '/pricing', icon: Calculator },
      { name: 'Operations', href: '/operations', icon: Truck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Payables', href: '/payables', icon: CreditCard },
      { name: 'Collections', href: '/collections', icon: Banknote },
      { name: 'Commissions', href: '/commissions', icon: Percent },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Database', href: '/database', icon: Database },
      { name: 'Activity Log', href: '/activity-log', icon: ScrollText },
      { name: 'Leave', href: '/leave-tracker', icon: CalendarDays },
      { name: 'Users', href: '/users', icon: UserCog },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const {
    profile,
    roles,
    signOut
  } = useAuth();

  const userRoles = (roles || []) as UserRole[];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      window.location.href = '/auth';
    }
  };

  const sidebarContent = (
    <>
      <div className="flex h-60 items-center justify-center px-4 border-b border-sidebar-border">
        <img src={nssLogo} alt="NSS - National Shipping Services" className="h-56 w-auto object-contain rounded-sm" />
      </div>

      <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
        {navigationGroups.map((group) => {
          const filteredItems = group.items.filter(item =>
            userRoles.length > 0 ? canAccessPage(userRoles, item.href) : false
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {filteredItems.map(item => {
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
              </div>
            </div>
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
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <img src={nssLogo} alt="NSS" className="h-8 w-auto object-contain ml-3" />
        </header>
      )}

      {/* Overlay backdrop (mobile) */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && 'top-14 h-[calc(100vh-3.5rem)]'
        )}
      >
        {isMobile ? (
          <>
            <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
              {navigationGroups.map((group) => {
                const filteredItems = group.items.filter(item =>
                  userRoles.length > 0 ? canAccessPage(userRoles, item.href) : false
                );
                if (filteredItems.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {filteredItems.map(item => {
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
                    </div>
                  </div>
                );
              })}
            </nav>
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
          </>
        ) : (
          sidebarContent
        )}
      </aside>
    </>
  );
}
