
-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_name text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  target_name text,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin/manager can view
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view all activity logs"
ON public.activity_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role));

-- System/anyone authenticated can insert (triggers run as security definer)
CREATE POLICY "System can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (true);

-- Trigger: log new user registration
CREATE OR REPLACE FUNCTION public.log_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (actor_id, actor_name, action, target_type, target_id, target_name, details)
  VALUES (NEW.id, NEW.display_name, 'create_account', 'user', NEW.id::text, NEW.display_name, 'Người dùng đã tạo tài khoản mới');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_user_registration();

-- Trigger: log new product created by seller
CREATE OR REPLACE FUNCTION public.log_product_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  seller_name text;
BEGIN
  SELECT display_name INTO seller_name FROM public.profiles WHERE id = NEW.seller_id;
  INSERT INTO public.activity_logs (actor_id, actor_name, action, target_type, target_id, target_name, details)
  VALUES (NEW.seller_id, COALESCE(seller_name, 'N/A'), 'create_product', 'product', NEW.id::text, NEW.name, 'Seller đã thêm sản phẩm: ' || NEW.name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_created
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_product_created();

-- Trigger: log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (actor_id, actor_name, action, target_type, target_id, details)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      COALESCE((SELECT display_name FROM public.profiles WHERE id = auth.uid()), 'System'),
      'update_order_status',
      'order',
      NEW.id::text,
      'Đơn hàng #' || LEFT(NEW.id::text, 8) || ': ' || COALESCE(OLD.status::text, 'N/A') || ' → ' || COALESCE(NEW.status::text, 'N/A')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_changed
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();
