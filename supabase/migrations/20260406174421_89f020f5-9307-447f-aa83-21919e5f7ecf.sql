
-- Fix 1: user_badges - block direct client inserts (system uses service role which bypasses RLS)
DROP POLICY IF EXISTS "System can award badges" ON public.user_badges;
CREATE POLICY "Only system functions can award badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Fix 2: activity_logs - restrict INSERT to authenticated only
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix 3: notifications - block direct client inserts (food-scheduler uses service role)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Only system can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Fix 4: food_reminder_logs - block direct client inserts
DROP POLICY IF EXISTS "System can insert reminder logs" ON public.food_reminder_logs;
CREATE POLICY "Only system can insert reminder logs"
  ON public.food_reminder_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);
