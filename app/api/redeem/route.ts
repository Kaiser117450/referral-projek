import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireCashier } from '@/lib/supabase/server';
import { codeRedemptionSchema } from '@/lib/validation';
import { verifyCodeHash } from '@/lib/utils';

// POST /api/redeem/verify
export async function POST(request: NextRequest) {
  try {
    const cashier = await requireCashier();
    const body = await request.json();
    
    // Validate input
    const validatedData = codeRedemptionSchema.parse(body);
    
    const supabase = await createServerClient();
    
    // Start transaction - get all active codes
    const { data: codes, error: codesError } = await supabase
      .from('ephemeral_codes')
      .select(`
        *,
        invite:invites(id, inviter_id, is_active),
        referred_user:profiles(id, full_name)
      `)
      .eq('status', 'ACTIVE')
      .gte('expires_at', new Date().toISOString());
    
    if (codesError) {
      console.error('Error fetching codes:', codesError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate code' },
        { status: 500 }
      );
    }
    
    // Find matching code by comparing hash
    let validCode = null;
    for (const codeRecord of codes || []) {
      const isValid = await verifyCodeHash(validatedData.code + codeRecord.salt, codeRecord.code_hash);
      
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
    
    // Check if code is already used
    if (validCode.status === 'USED') {
      return NextResponse.json({
        success: false,
        error: 'Code has already been used',
        data: { status: 'USED' },
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
    
    // Check if code is expired
    if (new Date() > new Date(validCode.expires_at)) {
      return NextResponse.json({
        success: false,
        error: 'Code has expired',
        data: { status: 'EXPIRED' },
      });
    }
    
    // Use database function to award points and check milestones
    const { data: pointsResult, error: pointsError } = await supabase
      .rpc('award_points_and_check_milestones', {
        p_user_id: validCode.invite.inviter_id,
        p_points: 1
      });
    
    if (pointsError) {
      console.error('Error awarding points:', pointsError);
      return NextResponse.json(
        { success: false, error: 'Failed to award points' },
        { status: 500 }
      );
    }
    
    // Mark code as used
    const { error: updateError } = await supabase
      .from('ephemeral_codes')
      .update({
        status: 'USED',
        used_at: new Date().toISOString(),
        used_by: cashier.id,
      })
      .eq('id', validCode.id);
    
    if (updateError) {
      console.error('Error updating code status:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update code status' },
        { status: 500 }
      );
    }
    
    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        code_id: validCode.id,
        inviter_id: validCode.invite.inviter_id,
        referred_user_id: validCode.referred_user_id,
        points_awarded: 1,
        redeemed_by: cashier.id,
      })
      .select()
      .single();
    
    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      return NextResponse.json(
        { success: false, error: 'Failed to create redemption record' },
        { status: 500 }
      );
    }
    
    // Create receipt JSON for storage
    const receipt = {
      redemption_id: redemption.id,
      code_id: validCode.id,
      inviter_id: validCode.invite.inviter_id,
      referred_user_id: validCode.referred_user_id,
      points_awarded: 1,
      redeemed_by: cashier.id,
      redeemed_at: new Date().toISOString(),
      code_generated_at: validCode.created_at,
      code_expired_at: validCode.expires_at,
      inviter_name: validCode.invite.inviter_id, // Will be resolved later
      referred_user_name: validCode.referred_user.full_name,
      cashier_name: cashier.id, // Will be resolved later
    };
    
    // Store receipt in Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('receipts')
      .upload(`${redemption.id}.json`, JSON.stringify(receipt), {
        contentType: 'application/json',
        upsert: false,
      });
    
    let receiptUrl = null;
    if (!storageError && storageData) {
      // Get public URL for the receipt
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(`${redemption.id}.json`);
      
      receiptUrl = urlData.publicUrl;
      
      // Update redemption with receipt URL
      await supabase
        .from('redemptions')
        .update({ receipt_url: receiptUrl })
        .eq('id', redemption.id);
    }
    
    // Get updated inviter profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, points')
      .eq('id', validCode.invite.inviter_id)
      .single();
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'SUCCESS',
        redemption_id: redemption.id,
        inviter_name: inviterProfile?.full_name || 'Unknown',
        inviter_points: inviterProfile?.points || 0,
        referred_user_name: validCode.referred_user.full_name,
        points_awarded: 1,
        receipt_url: receiptUrl,
        unlocked_milestones: pointsResult?.unlocked_milestones || [],
      },
      message: 'Code redeemed successfully',
    });
    
  } catch (error) {
    console.error('Error in redeem code:', error);
    
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

// GET /api/redeem/history
export async function GET(request: NextRequest) {
  try {
    const cashier = await requireCashier();
    const supabase = await createServerClient();
    
    // Get redemption history for this cashier
    const { data: redemptions, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        inviter:profiles!redemptions(inviter_id)(full_name),
        referred_user:profiles!redemptions(referred_user_id)(full_name),
        code:ephemeral_codes(created_at, expires_at)
      `)
      .eq('redeemed_by', cashier.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching redemptions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch redemption history' },
        { status: 500 }
      );
    }
    
    // Sanitize data
    const sanitizedRedemptions = redemptions?.map(redemption => ({
      id: redemption.id,
      inviter_name: redemption.inviter?.full_name || 'Unknown',
      referred_user_name: redemption.referred_user?.full_name || 'Unknown',
      points_awarded: redemption.points_awarded,
      redeemed_at: redemption.created_at,
      code_generated_at: redemption.code?.created_at,
      code_expired_at: redemption.code?.expires_at,
      receipt_url: redemption.receipt_url,
    })) || [];
    
    return NextResponse.json({
      success: true,
      data: sanitizedRedemptions,
    });
    
  } catch (error) {
    console.error('Error in get redemption history:', error);
    
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
