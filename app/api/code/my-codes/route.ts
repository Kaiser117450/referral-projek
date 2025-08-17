import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/supabase/server';

// GET /api/code/my-codes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createServerClient();
    
    // Get user's generated codes
    const { data: codes, error } = await supabase
      .from('ephemeral_codes')
      .select(`
        *,
        invite:invites(title, slug),
        redemptions(count)
      `)
      .eq('referred_user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching codes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch codes' },
        { status: 500 }
      );
    }
    
    // Filter out sensitive data
    const sanitizedCodes = codes?.map(code => ({
      id: code.id,
      inviteTitle: code.invite?.title,
      inviteSlug: code.invite?.slug,
      status: code.status,
      expiresAt: code.expires_at,
      usedAt: code.used_at,
      createdAt: code.created_at,
      redemptionCount: code.redemptions?.[0]?.count || 0,
    })) || [];
    
    return NextResponse.json({
      success: true,
      data: sanitizedCodes,
    });
    
  } catch (error) {
    console.error('Error in get codes:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
