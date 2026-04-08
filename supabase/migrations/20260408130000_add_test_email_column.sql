-- Add test_email column to profiles for admin testing purposes
ALTER TABLE public.profiles ADD COLUMN test_email TEXT DEFAULT NULL;

-- Create policy to allow admins to update test_email field
CREATE POLICY "Admins can update user test_email"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
