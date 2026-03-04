
-- 1. Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suppliers" ON public.suppliers
  FOR SELECT USING (true);

-- 2. Create product_suppliers junction table
CREATE TABLE public.product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, supplier_id)
);

ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product_suppliers" ON public.product_suppliers
  FOR SELECT USING (true);

-- 3. Create product_reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Add supplier_id to cart_items
ALTER TABLE public.cart_items ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id);

-- Drop the old unique constraint if exists (user_id, product_id)
-- and create the new one with supplier_id
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_product_supplier_unique 
  UNIQUE (user_id, product_id, supplier_id);
