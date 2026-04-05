import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify using service role key in Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { user_ids } = await req.json();
    if (!user_ids || !Array.isArray(user_ids)) {
      return new Response(JSON.stringify({ error: 'Missing user_ids array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const uid of user_ids) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
        results.push({ id: uid, success: !deleteError, error: deleteError?.message });
      } catch (e: any) {
        results.push({ id: uid, success: false, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({ deleted: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, total: user_ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
