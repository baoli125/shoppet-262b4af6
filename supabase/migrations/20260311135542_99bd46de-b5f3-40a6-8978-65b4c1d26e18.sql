-- Cho phép authenticated users update stock trong product_suppliers (khi đặt hàng)
CREATE POLICY "Authenticated users can update product_suppliers stock"
ON public.product_suppliers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Cho phép sellers update products stock (khi đặt hàng giảm tồn kho)
CREATE POLICY "Authenticated users can update product stock"
ON public.products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);