import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithRequest } from '@/lib/supabase/server';
import { generateUniqueSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const supabase = createServerClientWithRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  // deactivate existing links for this user
  await supabase
    .from('invites')
    .update({ is_active: false })
    .eq('user_id', user.id);

  // generate unique slug up to 6 characters
  let slug = '';
  let attempts = 0;
  const maxAttempts = 5;
  do {
    slug = generateUniqueSlug().slice(0, 6);
    const { data: existing } = await supabase
      .from('invites')
      .select('id')
      .eq('slug', slug)
      .single();
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    return NextResponse.json({ success: false, error: 'Failed to generate unique slug' }, { status: 500 });
  }

  const title = `Referral Link ${user.user_metadata?.name || ''}`.trim();
  const { data: link, error: insertError } = await supabase
    .from('invites')
    .insert({
      user_id: user.id,
      title,
      description: 'Link referral otomatis',
      slug,
      max_uses: 1,
      current_uses: 0,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating referral link:', insertError);
    return NextResponse.json({ success: false, error: 'Failed to create referral link' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: link });
}
