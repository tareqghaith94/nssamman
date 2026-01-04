import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessPage } from '@/lib/permissions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, roles, loading } = useAuth();
  
  // Calculate access BEFORE any hooks that depend on it
  // Use roles array for multi-role support
  const userRoles = roles as UserRole[];
  const hasAccess = userRoles.length > 0 ? canAccessPage(userRoles, location.pathname) : true;
  
  // ALL useEffect hooks MUST be called before any conditional returns
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!loading && profile && userRoles.length > 0 && !hasAccess) {
      toast.error(`Access denied. Your roles cannot access this page.`);
      navigate('/');
    }
  }, [loading, profile, userRoles, hasAccess, navigate]);

  // NOW we can have conditional returns (after all hooks)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Account Not Configured</h2>
          <p className="text-muted-foreground">
            Your account has not been set up yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
