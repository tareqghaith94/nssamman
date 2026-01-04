import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calculator, 
  CheckCircle, 
  Truck, 
  CreditCard, 
  Banknote, 
  Percent,
  ScrollText,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { canAccessPage } from '@/lib/permissions';
import { RoleSelector } from '@/components/auth/RoleSelector';
import nssLogo from '@/assets/nss-logo.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Pricing', href: '/pricing', icon: Calculator },
  { name: 'Confirmed', href: '/confirmed', icon: CheckCircle },
  { name: 'Operations', href: '/operations', icon: Truck },
  { name: 'Payables', href: '/payables', icon: CreditCard },
  { name: 'Collections', href: '/collections', icon: Banknote },
  { name: 'Commissions', href: '/commissions', icon: Percent },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'Activity Log', href: '/activity-log', icon: ScrollText },
];

export function Sidebar() {
  const location = useLocation();
  const currentUser = useUserStore((s) => s.currentUser);
  
  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => 
    canAccessPage(currentUser.role, item.href)
  );
  
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex h-20 items-center justify-center px-4 border-b border-sidebar-border">
        <img 
          src={nssLogo} 
          alt="NSS - National Shipping Services" 
          className="h-14 w-auto object-contain"
        />
      </div>
      
      <nav className="p-4 space-y-1 flex-1">
        {filteredNavigation.map((item) => {
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
      
      {/* Role selector at bottom for testing */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground mb-2">Testing Mode</div>
        <RoleSelector />
      </div>
    </aside>
  );
}
