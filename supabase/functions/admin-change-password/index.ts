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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'manager']);

    if (!roleCheck || roleCheck.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin/Manager access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const callerIsAdmin = roleCheck.some((r: any) => r.role === 'admin');

    const { target_user_id, new_password, current_password } = await req.json();
    if (!target_user_id || !new_password || new_password.length < 6) {
      return new Response(JSON.stringify({ error: 'Invalid input (password min 6 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if target is admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', target_user_id)
      .eq('role', 'admin');

    const targetIsAdmin = targetRoles && targetRoles.length > 0;

    // Manager cannot change admin's password
    if (!callerIsAdmin && targetIsAdmin) {
      return new Response(JSON.stringify({ error: 'Cannot change admin password' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Admin changing admin password requires current_password verification
    if (targetIsAdmin) {
      if (!current_password) {
        return new Response(JSON.stringify({ error: 'Current password required for admin accounts' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify current password by trying to sign in
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
      if (!targetUser?.user?.email) {
        return new Response(JSON.stringify({ error: 'Target user not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const verifyClient = createClient(supabaseUrl, supabaseAnonKey);
      const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: targetUser.user.email,
        password: current_password,
      });

      if (signInError) {
        return new Response(JSON.stringify({ error: 'Mật khẩu hiện tại không đúng' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      password: new_password,
    });

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
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
