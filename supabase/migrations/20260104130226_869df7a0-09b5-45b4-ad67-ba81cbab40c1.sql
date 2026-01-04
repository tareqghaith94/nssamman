-- Drop existing policies and recreate with proper logic
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Recreate admin policies using is_admin function instead of has_role
-- This avoids circular dependency issues
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.is_admin(auth.uid()));