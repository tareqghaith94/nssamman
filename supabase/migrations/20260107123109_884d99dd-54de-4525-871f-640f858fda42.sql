-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_name text NOT NULL,
  leave_type text NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  approved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own leave requests
CREATE POLICY "Users can view own leave requests"
ON public.leave_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all leave requests
CREATE POLICY "Admins can view all leave requests"
ON public.leave_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Users can insert their own leave requests
CREATE POLICY "Users can insert own leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can insert any leave request
CREATE POLICY "Admins can insert any leave request"
ON public.leave_requests
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Users can update their own pending leave requests
CREATE POLICY "Users can update own pending leave requests"
ON public.leave_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can update any leave request (for approval/rejection)
CREATE POLICY "Admins can update any leave request"
ON public.leave_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Users can delete their own pending leave requests
CREATE POLICY "Users can delete own pending leave requests"
ON public.leave_requests
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can delete any leave request
CREATE POLICY "Admins can delete any leave request"
ON public.leave_requests
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();