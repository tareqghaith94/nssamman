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
  const { isAuthenticated, profile, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Show loading while checking auth
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

  // Not authenticated - redirect handled by useEffect
  if (!isAuthenticated) {
    return null;
  }

  // No profile yet - user exists but no profile created
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

  // Check page access based on role
  const userRole = profile.role as UserRole;
  const hasAccess = canAccessPage(userRole, location.pathname);
  
  useEffect(() => {
    if (profile && !hasAccess) {
      toast.error(`Access denied. ${profile.role} role cannot access this page.`);
      navigate('/');
    }
  }, [hasAccess, navigate, profile]);

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
