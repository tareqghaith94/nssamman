-- Add a special policy to allow the first user to be created
-- This checks if there are no existing profiles, allowing bootstrap
CREATE POLICY "Allow first user creation"
ON public.profiles
FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
);