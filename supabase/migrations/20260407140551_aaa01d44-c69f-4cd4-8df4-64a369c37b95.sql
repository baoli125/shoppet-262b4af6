
-- Add user_id to suppliers to link sellers to their supplier profile
ALTER TABLE public.suppliers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create unique index so each user has at most one supplier entry
CREATE UNIQUE INDEX idx_suppliers_user_id ON public.suppliers(user_id) WHERE user_id IS NOT NULL;

-- Allow sellers to insert their own supplier entry
CREATE POLICY "Sellers can create own supplier"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'seller'::app_role));

-- Allow sellers to update their own supplier
CREATE POLICY "Sellers can update own supplier"
ON public.suppliers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow sellers to insert product_suppliers for their own supplier
CREATE POLICY "Sellers can insert own product_suppliers"
ON public.product_suppliers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = product_suppliers.supplier_id AND s.user_id = auth.uid()
  )
);

-- Allow sellers to update their own product_suppliers
CREATE POLICY "Sellers can update own product_suppliers"
ON public.product_suppliers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = product_suppliers.supplier_id AND s.user_id = auth.uid()
  )
);

-- Allow sellers to delete their own product_suppliers
CREATE POLICY "Sellers can delete own product_suppliers"
ON public.product_suppliers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = product_suppliers.supplier_id AND s.user_id = auth.uid()
  )
);

-- Function to get or create supplier for a seller
CREATE OR REPLACE FUNCTION public.get_or_create_supplier(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_id uuid;
  v_display_name text;
BEGIN
  -- Check if supplier already exists for this user
  SELECT id INTO v_supplier_id FROM public.suppliers WHERE user_id = p_user_id;
  
  IF v_supplier_id IS NOT NULL THEN
    RETURN v_supplier_id;
  END IF;
  
  -- Get display name from profile
  SELECT display_name INTO v_display_name FROM public.profiles WHERE id = p_user_id;
  
  -- Create new supplier
  INSERT INTO public.suppliers (name, user_id, description)
  VALUES (COALESCE(v_display_name, 'Shop'), p_user_id, 'Nhà cung cấp tự động')
  RETURNING id INTO v_supplier_id;
  
  RETURN v_supplier_id;
END;
$$;
