import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeTransaction } from '@/lib/turso';
import { codeRedemptionSchema } from '@/lib/validation';
import { verifyCodeHash } from '@/lib/utils';
// TODO: Replace with next-auth session management
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "app/api/auth/[...nextauth]/route"

// POST /api/redeem
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with next-auth session management for cashier
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'cashier') {
    //   return NextResponse.json({ success: false, error: 'Cashier role required' }, { status: 403 });
    // }
    // const cashierId = session.user.id;
    const cashierId = 'cashier-user-id'; // Hardcoded for now

    const body = await request.json();
    const validatedData = codeRedemptionSchema.parse(body);

    const activeCodesResult = await executeQuery("SELECT * FROM ephemeral_codes WHERE status = 'ACTIVE' AND expires_at > CURRENT_TIMESTAMP");
    const activeCodes = activeCodesResult.rows;

    let validCode = null;
    for (const codeRecord of activeCodes) {
      const isValid = await verifyCodeHash(validatedData.code, codeRecord.code_hash as string);
      if (isValid) {
        const inviteResult = await executeQuery('SELECT id, inviter_id, is_active FROM invites WHERE id = ?', [codeRecord.invite_id]);
        const invite = inviteResult.rows[0];
        validCode = { ...codeRecord, invite };
        break;
      }
    }
    
    if (!validCode) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code', data: { status: 'INVALID' } });
    }

    if (!validCode.invite?.is_active) {
      return NextResponse.json({ success: false, error: 'Referral link is no longer active', data: { status: 'INACTIVE' } });
    }

    const pointsToAward = 1;

    const tx = await executeTransaction([
      { sql: 'UPDATE profiles SET points = points + ? WHERE id = ?', args: [pointsToAward, validCode.invite.inviter_id] },
      { sql: "UPDATE ephemeral_codes SET status = 'USED', used_at = CURRENT_TIMESTAMP, used_by = ? WHERE id = ?", args: [cashierId, validCode.id] },
      { sql: 'INSERT INTO redemptions (code_id, inviter_id, referred_user_id, points_awarded, redeemed_by) VALUES (?, ?, ?, ?, ?)', args: [validCode.id, validCode.invite.inviter_id, validCode.referred_user_id, pointsToAward, cashierId] }
    ]);

    const redemptionId = tx[2].lastInsertRowid;

    const receipt = {
        redemption_id: redemptionId,
        code_id: validCode.id,
        inviter_id: validCode.invite.inviter_id,
        referred_user_id: validCode.referred_user_id,
        points_awarded: pointsToAward,
        redeemed_by: cashierId,
        redeemed_at: new Date().toISOString(),
    };

    await executeQuery('UPDATE redemptions SET receipt = ? WHERE id = ?', [JSON.stringify(receipt), redemptionId]);

    const inviterProfileResult = await executeQuery('SELECT full_name, points FROM profiles WHERE id = ?', [validCode.invite.inviter_id]);
    const inviterProfile = inviterProfileResult.rows[0];

    // Milestone check logic (replaces Supabase RPC)
    const { rows: milestones } = await executeQuery("SELECT id, points_required FROM milestones WHERE is_active = 1 ORDER BY points_required ASC");
    const { rows: userAwards } = await executeQuery("SELECT milestone_id FROM milestone_awards WHERE user_id = ?", [validCode.invite.inviter_id]);
    const awardedMilestoneIds = userAwards.map(a => a.milestone_id);

    const unlocked_milestones = [];
    for (const milestone of milestones) {
        if ((inviterProfile.points as number) >= (milestone.points_required as number) && !awardedMilestoneIds.includes(milestone.id)) {
            await executeQuery("INSERT INTO milestone_awards (user_id, milestone_id, status) VALUES (?, ?, 'UNLOCKED')", [validCode.invite.inviter_id, milestone.id]);
            unlocked_milestones.push(milestone);
        }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'SUCCESS',
        redemption_id: redemptionId,
        inviter_name: inviterProfile?.full_name || 'Unknown',
        inviter_points: inviterProfile?.points || 0,
        points_awarded: pointsToAward,
        unlocked_milestones: unlocked_milestones,
      },
      message: 'Code redeemed successfully',
    });

  } catch (error) {
    console.error('Error in redeem code:', error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/redeem/history
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with next-auth session management for cashier
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'cashier') {
    //   return NextResponse.json({ success: false, error: 'Cashier role required' }, { status: 403 });
    // }
    // const cashierId = session.user.id;
    const cashierId = 'cashier-user-id'; // Hardcoded for now

    const { rows: redemptions } = await executeQuery(`
      SELECT
        r.id,
        inviter.full_name as inviter_name,
        referred.full_name as referred_user_name,
        r.points_awarded,
        r.created_at as redeemed_at,
        ec.created_at as code_generated_at,
        ec.expires_at as code_expired_at,
        r.receipt
      FROM redemptions r
      JOIN profiles inviter ON r.inviter_id = inviter.id
      JOIN profiles referred ON r.referred_user_id = referred.id
      JOIN ephemeral_codes ec ON r.code_id = ec.id
      WHERE r.redeemed_by = ?
      ORDER BY r.created_at DESC
    `, [cashierId]);

    return NextResponse.json({ success: true, data: redemptions });

  } catch (error) {
    console.error('Error in get redemption history:', error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
