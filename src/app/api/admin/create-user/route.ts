import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error('[AUTH ERROR]:', authError.message);
      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    // 2. Use upsert to ensure the profile exists and has the correct role/name
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: role
      });

    if (profileError) {
      console.error('[PROFILE ERROR]:', profileError.message);
      return NextResponse.json({ success: false, error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error('[CRITICAL ERROR]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
