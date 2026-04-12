-- Add is_has_pet column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_has_pet boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.is_has_pet IS 'Automatically tracks whether user has at least one pet';

-- Update existing users based on current pets data
UPDATE public.profiles
SET is_has_pet = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.pets 
  WHERE user_id IS NOT NULL
);

-- Function to update is_has_pet when a pet is added or deleted
CREATE OR REPLACE FUNCTION public.update_user_has_pet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update to true when pet is added/updated
    UPDATE public.profiles
    SET is_has_pet = true
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if user still has any pets after deletion
    UPDATE public.profiles
    SET is_has_pet = (
      SELECT COUNT(*) > 0 
      FROM public.pets 
      WHERE user_id = OLD.user_id
    )
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on pets table
DROP TRIGGER IF EXISTS trigger_update_user_has_pet ON public.pets;
CREATE TRIGGER trigger_update_user_has_pet
AFTER INSERT OR UPDATE OR DELETE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_user_has_pet();
