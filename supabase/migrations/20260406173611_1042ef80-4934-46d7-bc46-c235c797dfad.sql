
-- Drop existing policies (both old and new naming)
DROP POLICY IF EXISTS "Users can upload own pet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own pet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own pet images" ON storage.objects;

-- Recreate with path-scoped access
CREATE POLICY "Users can upload own pet images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pet-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own pet images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pet-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own pet images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pet-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
