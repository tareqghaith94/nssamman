import { useUserStore, MOCK_USERS, SALES_USERS } from '@/store/userStore';
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

interface UserStoreUser {
  id: string;
  name: string;
  role: UserRole;
  refPrefix?: string;
  roles: UserRole[];
}

export function RoleSelector() {
  const currentUser = useUserStore((s) => s.currentUser);
  const setUser = useUserStore((s) => s.setUser);
  
  // Create a combined list: non-sales roles + individual salespeople
  const allUsers: UserStoreUser[] = [
    MOCK_USERS.admin,
    ...SALES_USERS, // All individual salespeople
    MOCK_USERS.pricing,
    MOCK_USERS.ops,
    MOCK_USERS.collections,
    MOCK_USERS.finance,
  ];
  
  const handleChange = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setUser(user);
    }
  };
  
  const getDisplayLabel = (user: UserStoreUser) => {
    if (user.role === 'sales') {
      return `Sales: ${user.name}`;
    }
    return ROLE_LABELS[user.role];
  };
  
  return (
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentUser.id}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue>{getDisplayLabel(currentUser)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {getDisplayLabel(user)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
