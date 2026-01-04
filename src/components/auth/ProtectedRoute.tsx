import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { canAccessPage } from '@/lib/permissions';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  
  const hasAccess = canAccessPage(currentUser.role, location.pathname);
  
  useEffect(() => {
    if (!hasAccess) {
      toast.error(`Access denied. ${currentUser.role} role cannot access this page.`);
      navigate('/');
    }
  }, [hasAccess, navigate, currentUser.role]);
  
  if (!hasAccess) {
    return null;
  }
  
  return <>{children}</>;
}
