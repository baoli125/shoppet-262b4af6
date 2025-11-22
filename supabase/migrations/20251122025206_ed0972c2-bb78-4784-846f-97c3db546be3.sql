-- Update vaccines table to support verification and detailed tracking
ALTER TABLE public.vaccines 
ADD COLUMN IF NOT EXISTS batch_no TEXT,
ADD COLUMN IF NOT EXISTS clinic TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS valid_until DATE,
ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Update feeding_logs to support multi-pet allocation
ALTER TABLE public.feeding_logs
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS quantity_packs INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_grams NUMERIC,
ADD COLUMN IF NOT EXISTS policy_used TEXT DEFAULT 'split-by-need',
ADD COLUMN IF NOT EXISTS per_pet_allocation JSONB,
ADD COLUMN IF NOT EXISTS remind_at TIMESTAMP WITH TIME ZONE;

-- Backfill owner_id from pet_id relationship
UPDATE public.feeding_logs fl
SET owner_id = p.user_id
FROM public.pets p
WHERE fl.pet_id = p.id AND fl.owner_id IS NULL;

-- Create food_reminder_logs table
CREATE TABLE IF NOT EXISTS public.food_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feeding_log_id UUID NOT NULL REFERENCES public.feeding_logs(id) ON DELETE CASCADE,
  remind_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  channel TEXT DEFAULT 'in-app',
  succeeded BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add pet daily intake override field
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS daily_food_override_gr NUMERIC;

-- Add portion fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS portion_gr_per_day NUMERIC,
ADD COLUMN IF NOT EXISTS portion_gr_per_kg_per_day NUMERIC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feeding_logs_owner_remind ON public.feeding_logs(owner_id, remind_at) WHERE remind_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_food_reminder_logs_feeding ON public.food_reminder_logs(feeding_log_id);
CREATE INDEX IF NOT EXISTS idx_vaccines_next_date ON public.vaccines(next_date) WHERE next_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vaccines_pet_verified ON public.vaccines(pet_id, verified_by);

-- RLS for food_reminder_logs
ALTER TABLE public.food_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminder logs"
ON public.food_reminder_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.feeding_logs fl
  JOIN public.pets p ON fl.pet_id = p.id
  WHERE fl.id = food_reminder_logs.feeding_log_id
  AND p.user_id = auth.uid()
));

CREATE POLICY "System can insert reminder logs"
ON public.food_reminder_logs FOR INSERT
WITH CHECK (true);

-- Add trigger to update feeding_logs updated_at
CREATE OR REPLACE FUNCTION update_feeding_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_feeding_logs_updated_at ON public.feeding_logs;
CREATE TRIGGER trigger_update_feeding_logs_updated_at
  BEFORE UPDATE ON public.feeding_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_feeding_logs_updated_at();