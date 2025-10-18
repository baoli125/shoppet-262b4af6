-- Fix SECURITY DEFINER view by using SECURITY INVOKER
-- This makes the view execute with the permissions of the querying user, not the view creator
-- This is safer and more transparent for public community features

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker=true) AS
SELECT 
  id, 
  display_name, 
  avatar_url, 
  points
FROM public.profiles;