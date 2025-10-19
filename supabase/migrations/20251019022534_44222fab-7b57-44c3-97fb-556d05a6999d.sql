-- Add is_new_user column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_new_user boolean DEFAULT true;

-- Update existing users to be considered as old users
UPDATE public.profiles SET is_new_user = false WHERE has_completed_onboarding = true;

-- Update the handle_new_user trigger to set is_new_user = true for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, is_new_user, has_completed_onboarding)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    true,
    false
  );
  RETURN new;
END;
$$;