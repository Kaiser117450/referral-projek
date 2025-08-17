import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithRequest } from '@/lib/supabase/server';
import { generateCodeSchema } from '@/lib/validation';
import { generateRandomCode, hashCode, generateSalt, calculateExpiryTime } from '@/lib/utils';

// POST /api/code/generate
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClientWithRequest(request);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json();

    // Validate input
    const validatedData = generateCodeSchema.parse(body);

    // Verify the user is the referred user
    if (validatedData.referredUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to generate code for this user' },
        { status: 403 }
      );
    }
    
    // Check if invite exists and is active
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('id, inviter_id, is_active')
      .eq('id', validatedData.inviteId)
      .single();
    
    if (inviteError || !invite) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite' },
        { status: 404 }
      );
    }
    
    if (!invite.is_active) {
      return NextResponse.json(
        { success: false, error: 'Invite is not active' },
        { status: 400 }
      );
    }
    
    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('invite_id', validatedData.inviteId)
      .eq('referred_user_id', validatedData.referredUserId)
      .single();
    
    if (!existingReferral) {
      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          invite_id: validatedData.inviteId,
          inviter_id: invite.inviter_id,
          referred_user_id: validatedData.referredUserId,
          status: 'active',
        });
      
      if (referralError) {
        console.error('Error creating referral:', referralError);
        return NextResponse.json(
          { success: false, error: 'Failed to create referral' },
          { status: 500 }
        );
      }
    }
    
    // Generate unique code
    let code: string;
    let codeHash: string;
    let salt: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      code = generateRandomCode(8);
      salt = generateSalt();
      codeHash = await hashCode(code, salt);
      
      // Check if hash already exists (very unlikely but safe)
      const { data: existingCode } = await supabase
        .from('ephemeral_codes')
        .select('id')
        .eq('code_hash', codeHash)
        .single();
      
      if (!existingCode) break;
      
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }
    
    // Calculate expiry time
    const expiresAt = calculateExpiryTime(5); // 5 minutes
    
    // Insert the code
    const { data: newCode, error: insertError } = await supabase
      .from('ephemeral_codes')
      .insert({
        code_hash: codeHash,
        salt: salt,
        invite_id: validatedData.inviteId,
        referred_user_id: validatedData.referredUserId,
        expires_at: expiresAt,
        status: 'ACTIVE',
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting code:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate code' },
        { status: 500 }
      );
    }
    
    // Return the plain code (only once, never stored)
    return NextResponse.json({
      success: true,
      data: {
        code: code,
        expiresAt: expiresAt,
        message: 'Code generated successfully. Use it within 5 minutes.',
      },
    });
    
  } catch (error) {
    console.error('Error generating code:', error);
    
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
