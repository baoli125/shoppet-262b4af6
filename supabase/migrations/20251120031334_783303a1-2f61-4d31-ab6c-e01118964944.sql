-- ===========================
-- FEEDING LOGS TABLE (Nhật ký dinh dưỡng)
-- ===========================
CREATE TABLE IF NOT EXISTS public.feeding_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_weight TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_days INTEGER NOT NULL,
  end_date DATE GENERATED ALWAYS AS (start_date + estimated_days) STORED,
  actual_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feeding_logs
CREATE POLICY "Users can view feeding logs for own pets"
ON public.feeding_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = feeding_logs.pet_id 
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert feeding logs for own pets"
ON public.feeding_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = feeding_logs.pet_id 
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update feeding logs for own pets"
ON public.feeding_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = feeding_logs.pet_id 
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete feeding logs for own pets"
ON public.feeding_logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = feeding_logs.pet_id 
    AND pets.user_id = auth.uid()
  )
);

-- ===========================
-- MEDICAL RECORDS TABLE (Bệnh lý & lịch khám)
-- ===========================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('condition', 'checkup', 'prescription')),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  veterinarian TEXT,
  clinic_name TEXT,
  next_checkup_date DATE,
  prescription_details TEXT,
  attachments TEXT[], -- Array of file URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_records
CREATE POLICY "Users can view medical records for own pets"
ON public.medical_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = medical_records.pet_id 
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert medical records for own pets"
ON public.medical_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = medical_records.pet_id 
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update medical records for own pets"
ON public.medical_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = medical_records.pet_id 
    AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete medical records for own pets"
ON public.medical_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.pets
    WHERE pets.id = medical_records.pet_id 
    AND pets.user_id = auth.uid()
  )
);

-- ===========================
-- NOTIFICATIONS TABLE (Hệ thống nhắc nhở)
-- ===========================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('feeding', 'vaccine', 'checkup', 'order', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  related_id UUID, -- Can reference pet_id, product_id, order_id, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- ===========================
-- TRIGGERS FOR UPDATED_AT
-- ===========================
CREATE TRIGGER update_feeding_logs_updated_at
BEFORE UPDATE ON public.feeding_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================
CREATE INDEX idx_feeding_logs_pet_id ON public.feeding_logs(pet_id);
CREATE INDEX idx_feeding_logs_end_date ON public.feeding_logs(end_date);
CREATE INDEX idx_medical_records_pet_id ON public.medical_records(pet_id);
CREATE INDEX idx_medical_records_date ON public.medical_records(date);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);