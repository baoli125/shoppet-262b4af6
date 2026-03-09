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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const adminEmail = 'admin@shoppet.app';
    const adminPassword = 'admin';

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    if (existingAdmin) {
      // Ensure admin role exists
      const { data: roleCheck } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', existingAdmin.id)
        .eq('role', 'admin')
        .single();

      if (!roleCheck) {
        await supabaseAdmin.from('user_roles').insert({ user_id: existingAdmin.id, role: 'admin' });
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin already exists', user_id: existingAdmin.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { display_name: 'Admin' },
    });

    if (userError) throw userError;

    // Add admin role
    await supabaseAdmin.from('user_roles').insert({ user_id: userData.user.id, role: 'admin' });

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({ display_name: 'Admin', is_new_user: false, has_completed_onboarding: true })
      .eq('id', userData.user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Admin created', user_id: userData.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
