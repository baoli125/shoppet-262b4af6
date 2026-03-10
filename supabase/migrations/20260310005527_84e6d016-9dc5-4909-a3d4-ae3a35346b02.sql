DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
  SELECT id, display_name, avatar_url, points
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;