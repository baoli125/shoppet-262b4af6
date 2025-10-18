-- Fix 1: Restrict profiles SELECT policy to protect PII (emails, phone numbers)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a view for public profile information (for community features)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, display_name, avatar_url, points
FROM public.profiles;

-- Fix 2: Add explicit INSERT policy to profiles table
-- This provides defense in depth alongside the trigger
CREATE POLICY "Only system can create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (false);

-- Fix 3: Create pet-images storage bucket with proper RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-images', 'pet-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own pet images
CREATE POLICY "Users can upload own pet images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view pet images (for community features)
CREATE POLICY "Anyone can view pet images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-images');

-- Allow users to delete their own pet images
CREATE POLICY "Users can delete own pet images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pet-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own pet images
CREATE POLICY "Users can update own pet images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pet-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);