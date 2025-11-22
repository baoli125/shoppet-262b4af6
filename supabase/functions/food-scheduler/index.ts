import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FeedingLog {
  id: string;
  owner_id: string;
  remind_at: string;
  per_pet_allocation: any;
  product_name: string;
}

interface Vaccine {
  id: string;
  pet_id: string;
  name: string;
  next_date: string;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    console.log('Running food scheduler at', now);

    // 1. Check for food reminders
    const { data: feedingLogs, error: feedingError } = await supabase
      .from('feeding_logs')
      .select('id, owner_id, remind_at, per_pet_allocation, product_name')
      .lte('remind_at', now)
      .is('actual_end_date', null);

    if (feedingError) {
      console.error('Error fetching feeding logs:', feedingError);
    } else if (feedingLogs && feedingLogs.length > 0) {
      console.log(`Found ${feedingLogs.length} feeding logs needing reminders`);

      // Group by owner to avoid spam
      const byOwner = feedingLogs.reduce((acc: any, log: FeedingLog) => {
        if (!acc[log.owner_id]) acc[log.owner_id] = [];
        acc[log.owner_id].push(log);
        return acc;
      }, {});

      // Create notifications for each owner
      for (const [ownerId, logs] of Object.entries(byOwner)) {
        const logsList = logs as FeedingLog[];
        const petNames = logsList
          .flatMap((log: FeedingLog) => {
            if (log.per_pet_allocation) {
              return Object.values(log.per_pet_allocation).map((p: any) => p.petName);
            }
            return [];
          })
          .filter((name, index, self) => self.indexOf(name) === index)
          .join(', ');

        const message = logsList.length === 1
          ? `Thức ăn cho ${petNames} sắp hết trong vòng 5 ngày. Bạn có muốn mua thêm?`
          : `${logsList.length} loại thức ăn cho ${petNames} sắp hết. Kiểm tra và mua thêm nhé!`;

        // Create notification
        await supabase.from('notifications').insert({
          user_id: ownerId,
          type: 'food_expiring',
          title: '🍖 Thức ăn sắp hết',
          message,
          action_url: '/pets',
          scheduled_for: now
        });

        // Log reminders sent
        for (const log of logsList) {
          await supabase.from('food_reminder_logs').insert({
            feeding_log_id: log.id,
            remind_date: today,
            sent_at: now,
            channel: 'in-app',
            succeeded: true,
            metadata: { pet_names: petNames }
          });

          // Update remind_at to prevent duplicate notifications
          await supabase
            .from('feeding_logs')
            .update({ remind_at: null })
            .eq('id', log.id);
        }

        console.log(`Sent food reminder to owner ${ownerId} for ${logsList.length} logs`);
      }
    }

    // 2. Check for vaccine reminders (7 days before next_date)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 7);
    const reminderDateStr = reminderDate.toISOString().split('T')[0];

    const { data: vaccines, error: vaccineError } = await supabase
      .from('vaccines')
      .select('id, pet_id, name, next_date')
      .eq('next_date', reminderDateStr);

    if (vaccineError) {
      console.error('Error fetching vaccines:', vaccineError);
    } else if (vaccines && vaccines.length > 0) {
      console.log(`Found ${vaccines.length} vaccines needing reminders`);

      // Get pet owners
      const petIds = [...new Set(vaccines.map((v: Vaccine) => v.pet_id))];
      const { data: pets } = await supabase
        .from('pets')
        .select('id, user_id, name')
        .in('id', petIds);

      if (pets) {
        // Group by owner
        const byOwner: any = {};
        for (const vaccine of vaccines) {
          const pet = pets.find((p: any) => p.id === vaccine.pet_id);
          if (pet) {
            if (!byOwner[pet.user_id]) byOwner[pet.user_id] = [];
            byOwner[pet.user_id].push({ ...vaccine, petName: pet.name });
          }
        }

        // Send notifications
        for (const [ownerId, vaccineList] of Object.entries(byOwner)) {
          const list = vaccineList as any[];
          const message = list.length === 1
            ? `Bé ${list[0].petName} cần tiêm "${list[0].name}" vào ${list[0].next_date}`
            : `${list.length} mũi tiêm sắp đến hạn cho thú cưng của bạn`;

          await supabase.from('notifications').insert({
            user_id: ownerId,
            type: 'vaccine_due',
            title: '💉 Nhắc lịch tiêm chủng',
            message,
            action_url: '/pets',
            scheduled_for: now
          });

          console.log(`Sent vaccine reminder to owner ${ownerId} for ${list.length} vaccines`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        food_reminders: feedingLogs?.length || 0,
        vaccine_reminders: vaccines?.length || 0,
        timestamp: now 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});