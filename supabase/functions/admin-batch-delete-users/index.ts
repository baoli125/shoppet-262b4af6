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

    const { user_ids } = await req.json();
    if (!user_ids || !Array.isArray(user_ids)) {
      return new Response(JSON.stringify({ error: 'Missing user_ids array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Hardcoded keep list for safety
    const keepIds = new Set([
      '30925599-1861-4225-89ae-643e859f60d7',
      '37492f49-9afe-4085-a0fe-75cce73c9e6b',
      '31c9ce16-b3b2-4cba-a29d-47836270b941',
      '97d6c01a-79fd-4ccf-856c-4de7d0f37ffe',
      '5c24f615-9ded-4bdb-aa20-109b36082a4c'
    ]);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let deleted = 0;
    let failed = 0;

    for (const uid of user_ids) {
      if (keepIds.has(uid)) { 
        failed++;
        continue; 
      }
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
        if (error) { failed++; } else { deleted++; }
      } catch { failed++; }
    }

    return new Response(
      JSON.stringify({ deleted, failed, total: user_ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
