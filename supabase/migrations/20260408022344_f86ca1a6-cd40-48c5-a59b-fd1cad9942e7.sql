-- Admin can update any product
CREATE POLICY "Admins can update any product"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Manager can update any product
CREATE POLICY "Managers can update any product"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

-- Admin can manage product_suppliers
CREATE POLICY "Admins can insert product_suppliers"
ON public.product_suppliers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product_suppliers"
ON public.product_suppliers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product_suppliers"
ON public.product_suppliers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Manager can manage product_suppliers
CREATE POLICY "Managers can insert product_suppliers"
ON public.product_suppliers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update product_suppliers"
ON public.product_suppliers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can delete product_suppliers"
ON public.product_suppliers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));