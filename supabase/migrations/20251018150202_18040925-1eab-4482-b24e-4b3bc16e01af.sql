-- Add onboarding completion field to profiles
ALTER TABLE public.profiles
ADD COLUMN has_completed_onboarding boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.has_completed_onboarding IS 'Tracks if user has completed initial onboarding (true = experienced user, false = new user needing guidance)';