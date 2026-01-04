import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  user_id: string;
  name: string;
  role: AppRole;
  department: string | null;
  ref_prefix: string | null;
  created_at: string;
}

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'ops', label: 'Operations' },
  { value: 'collections', label: 'Collections' },
  { value: 'finance', label: 'Finance' },
];

const REF_PREFIXES = ['A', 'T', 'M', 'R', 'S', 'U', 'MA'];

export default function UserManagement() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    selectedRoles: ['sales'] as AppRole[],
    department: '',
    ref_prefix: '',
  });

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsersWithRoles();
    }
  }, [authLoading, isAdmin]);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      toast.error('Failed to fetch users');
      console.error(profilesError);
      setLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Combine profiles with their roles
    const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
      const roles = userRoles
        ?.filter(ur => ur.user_id === profile.user_id)
        .map(ur => ur.role) || [];
      return { ...profile, roles };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleRole = (role: AppRole) => {
    setFormData(prev => {
      const newRoles = prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role];
      
      // Ensure at least one role is selected
      if (newRoles.length === 0) return prev;
      
      return { ...prev, selectedRoles: newRoles };
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreating(true);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) {
      toast.error(authError.message);
      setCreating(false);
      return;
    }

    if (!authData.user) {
      toast.error('Failed to create user');
      setCreating(false);
      return;
    }

    // Use the first selected role as the primary role in profile
    const primaryRole = formData.selectedRoles[0];

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        name: formData.name,
        role: primaryRole,
        department: formData.department || null,
        ref_prefix: formData.selectedRoles.includes('sales') ? formData.ref_prefix || null : null,
      });

    if (profileError) {
      toast.error('User created but profile failed: ' + profileError.message);
      setCreating(false);
      return;
    }

    // Insert all roles into user_roles table
    const roleInserts = formData.selectedRoles.map(role => ({
      user_id: authData.user!.id,
      role,
    }));

    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert(roleInserts);

    if (rolesError) {
      toast.error('User created but roles assignment failed: ' + rolesError.message);
    } else {
      toast.success(`User ${formData.name} created with ${formData.selectedRoles.length} role(s)`);
    }

    setCreateDialogOpen(false);
    setFormData({
      email: '',
      password: '',
      name: '',
      selectedRoles: ['sales'],
      department: '',
      ref_prefix: '',
    });
    fetchUsersWithRoles();
    setCreating(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check if sales role is selected (to show ref prefix field)
  const hasSalesRole = formData.selectedRoles.includes('sales');

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create and manage user accounts with multiple roles"
        action={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Roles * (select one or more)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border bg-muted/20">
                    {ROLES.map((role) => (
                      <div key={role.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.value}`}
                          checked={formData.selectedRoles.includes(role.value)}
                          onCheckedChange={() => toggleRole(role.value)}
                        />
                        <Label 
                          htmlFor={`role-${role.value}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users with multiple roles will have combined permissions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Sales, Operations"
                  />
                </div>
                {hasSalesRole && (
                  <div className="space-y-2">
                    <Label htmlFor="ref_prefix">Reference Prefix</Label>
                    <Select
                      value={formData.ref_prefix}
                      onValueChange={(v) => setFormData({ ...formData, ref_prefix: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select prefix" />
                      </SelectTrigger>
                      <SelectContent>
                        {REF_PREFIXES.map((prefix) => (
                          <SelectItem key={prefix} value={prefix}>
                            {prefix}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for generating shipment reference IDs (required for Sales role)
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Ref Prefix</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found. Create the first user above.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge 
                            key={role} 
                            variant={role === 'admin' ? 'default' : 'secondary'} 
                            className="capitalize"
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    {user.ref_prefix ? (
                      <Badge variant="outline">{user.ref_prefix}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
