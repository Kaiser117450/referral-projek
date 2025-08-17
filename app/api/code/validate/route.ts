import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyCodeHash } from '@/lib/utils';

// GET /api/code/validate?code=ABC123
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code parameter required' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerClient();
    
    // Get all active codes and check if any match
    const { data: codes, error } = await supabase
      .from('ephemeral_codes')
      .select(`
        *,
        invite:invites(title, slug, is_active),
        inviter:profiles!invites(inviter_id)(full_name)
      `)
      .eq('status', 'ACTIVE')
      .gte('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Error fetching codes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to validate code' },
        { status: 500 }
      );
    }
    
    // Find matching code by comparing hash
    let validCode = null;
    for (const codeRecord of codes || []) {
      const isValid = await verifyCodeHash(code, codeRecord.code_hash, codeRecord.salt);
      
      if (isValid) {
        validCode = codeRecord;
        break;
      }
    }
    
    if (!validCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired code',
        data: { status: 'INVALID' },
      });
    }
    
    // Check if invite is still active
    if (!validCode.invite?.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Referral link is no longer active',
        data: { status: 'INACTIVE' },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'VALID',
        codeId: validCode.id,
        inviteTitle: validCode.invite?.title,
        inviterName: validCode.inviter?.full_name,
        expiresAt: validCode.expires_at,
      },
    });
    
  } catch (error) {
    console.error('Error in validate code:', error);
    
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
