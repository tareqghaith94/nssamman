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
  Ship
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { canAccessPage } from '@/lib/permissions';
import { RoleSelector } from '@/components/auth/RoleSelector';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Pricing', href: '/pricing', icon: Calculator },
  { name: 'Confirmed', href: '/confirmed', icon: CheckCircle },
  { name: 'Operations', href: '/operations', icon: Truck },
  { name: 'Payables', href: '/payables', icon: CreditCard },
  { name: 'Collections', href: '/collections', icon: Banknote },
  { name: 'Commissions', href: '/commissions', icon: Percent },
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
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
          <Ship className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-lg text-sidebar-foreground">FreightFlow</h1>
          <p className="text-xs text-muted-foreground">Shipment Manager</p>
        </div>
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
