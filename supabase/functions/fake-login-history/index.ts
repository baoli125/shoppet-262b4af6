import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_DB_URL = Deno.env.get('SUPABASE_DB_URL')!;

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
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (usersError) throw usersError;

    // Filter users without last_sign_in_at
    const targetUsers = users.users.filter(u => !u.last_sign_in_at);
    console.log(`Found ${targetUsers.length} users without last_sign_in_at`);

    if (targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users need updating', total: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Use postgres to directly update auth.users.last_sign_in_at
    // Import postgres driver
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js');
    const sql = postgres(SUPABASE_DB_URL, { ssl: 'require' });

    let successful = 0;
    let failed = 0;
    const results: any[] = [];

    for (const user of targetUsers) {
      const randomDate = getRandomLastSignInDate();
      try {
        await sql`
          UPDATE auth.users 
          SET last_sign_in_at = ${randomDate}::timestamptz
          WHERE id = ${user.id}::uuid
        `;
        successful++;
        if (results.length < 10) {
          results.push({ userId: user.id, success: true, date: randomDate });
        }
      } catch (e) {
        failed++;
        console.error(`Failed to update user ${user.id}:`, e.message);
        if (results.length < 10) {
          results.push({ userId: user.id, success: false, error: e.message });
        }
      }
    }

    await sql.end();

    return new Response(
      JSON.stringify({
        message: `Updated ${successful} users with last_sign_in_at`,
        failed,
        total: targetUsers.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
