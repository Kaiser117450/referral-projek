import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithRequest } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createServerClientWithRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const { data: link, error: fetchError } = await supabase
    .from('invites')
    .select('id, slug, title, description, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching referral link:', fetchError);
    return NextResponse.json({ success: false, error: 'Failed to fetch referral link' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: link });
}
