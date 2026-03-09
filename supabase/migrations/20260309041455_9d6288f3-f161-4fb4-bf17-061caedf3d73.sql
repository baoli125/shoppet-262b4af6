
-- Add soft delete fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS delete_reason text,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Create deletion_logs table for tracking all admin deletions
CREATE TABLE public.deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL, -- 'account', 'product', 'order', 'post', etc.
  target_id text NOT NULL,
  target_name text,
  user_id uuid NOT NULL, -- the affected user
  reason text NOT NULL,
  deleted_by uuid NOT NULL, -- admin/manager who deleted
  is_acknowledged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion logs
CREATE POLICY "Users can view own deletion logs"
  ON public.deletion_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update (acknowledge) own deletion logs
CREATE POLICY "Users can acknowledge own deletion logs"
  ON public.deletion_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin/manager can insert deletion logs
CREATE POLICY "Admins can insert deletion logs"
  ON public.deletion_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Admin/manager can view all deletion logs
CREATE POLICY "Admins can view all deletion logs"
  ON public.deletion_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
