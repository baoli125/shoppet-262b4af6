
DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;
DROP FUNCTION IF EXISTS public.log_order_status_change();
