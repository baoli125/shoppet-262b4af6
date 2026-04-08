
-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Anyone can view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated users can upload product images to their own folder
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Sellers can update their own product images
CREATE POLICY "Sellers can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Sellers can delete their own product images
CREATE POLICY "Sellers can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products' AND (storage.foldername(name))[2] = auth.uid()::text);
