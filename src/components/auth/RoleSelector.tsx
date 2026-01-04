import { useUserStore, MOCK_USERS } from '@/store/userStore';
import { UserRole } from '@/types/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  sales: 'Sales',
  pricing: 'Pricing',
  ops: 'Operations',
  collections: 'Collections',
  finance: 'Finance',
};

export function RoleSelector() {
  const currentUser = useUserStore((s) => s.currentUser);
  const setRole = useUserStore((s) => s.setRole);
  
  return (
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentUser.role}
        onValueChange={(value) => setRole(value as UserRole)}
      >
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <SelectItem key={role} value={role}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
