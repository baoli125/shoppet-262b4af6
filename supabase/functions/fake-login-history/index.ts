import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Generate random date between 13/03/2026 and 10/04/2026
function getRandomLastSignInDate(): string {
  const startDate = new Date('2026-03-13').getTime();
  const endDate = new Date('2026-04-10').getTime();
  const randomTime = startDate + Math.random() * (endDate - startDate);
  return new Date(randomTime).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get users created from the waitlist (approximate by email domain or created_at)
    // Or get users with no last_sign_in_at
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) throw usersError;

    // Filter users: those with no last_sign_in_at or created recently (our 100 users)
    const targetUsers = users.users.filter(u => 
      !u.last_sign_in_at || 
      (u.email?.includes('@shoppet.local') || u.email?.includes('@')) && !u.last_sign_in_at
    );

    console.log(`Found ${targetUsers.length} users without login history`);

    // Also get the specific 100 users we just created (by checking profiles or email pattern)
    const { data: recentProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .order('created_at', { ascending: false })
      .limit(150);

    if (profilesError) throw profilesError;

    // Combine unique user IDs
    const userIdsToUpdate = new Set<string>();
    
    // Add users without last_sign_in_at
    targetUsers.forEach(u => userIdsToUpdate.add(u.id));
    
    // Add recent profiles
    recentProfiles?.forEach(p => userIdsToUpdate.add(p.id));

    console.log(`Updating ${userIdsToUpdate.size} users with fake login history`);

    // Update each user with a random last_sign_in_at
    const updates = Array.from(userIdsToUpdate).map(async (userId) => {
      const randomDate = getRandomLastSignInDate();
      try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          // Note: last_sign_in_at is read-only in admin API
          // Instead, we'll store it in user_metadata
          user_metadata: { 
            last_sign_in_at: randomDate,
            fake_login: true 
          },
        });
        
        if (error) {
          console.error(`Failed to update user ${userId}:`, error);
          return { userId, success: false, error: error.message };
        }
        
        return { userId, success: true, date: randomDate };
      } catch (e) {
        console.error(`Error updating user ${userId}:`, e);
        return { userId, success: false, error: e.message };
      }
    });

    const results = await Promise.all(updates);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Updated ${successful} users with fake login history`,
        failed: failed,
        total: userIdsToUpdate.size,
        results: results.slice(0, 10), // Show first 10 results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
