import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeTransaction } from '@/lib/turso';
import { generateCodeSchema } from '@/lib/validation';
import { generateRandomCode, hashCode, generateSalt, calculateExpiryTime } from '@/lib/utils';
// TODO: Replace with next-auth session management
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "app/api/auth/[...nextauth]/route"

// POST /api/code
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with next-auth session management
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    // }
    // const userId = session.user.id;
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // Hardcoded for now

    const body = await request.json();

    // Validate input
    const validatedData = generateCodeSchema.parse(body);

    // Verify the user is the referred user
    if (validatedData.referredUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to generate code for this user' },
        { status: 403 }
      );
    }

    // Check if invite exists and is active
    const inviteResult = await executeQuery('SELECT id, inviter_id, is_active FROM invites WHERE id = ?', [validatedData.inviteId]);
    const invite = inviteResult.rows[0];

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Invalid invite' }, { status: 404 });
    }

    if (!invite.is_active) {
      return NextResponse.json({ success: false, error: 'Invite is not active' }, { status: 400 });
    }

    // Check if referral already exists, if not create it
    const existingReferralResult = await executeQuery('SELECT id FROM referrals WHERE invite_id = ? AND referred_user_id = ?', [validatedData.inviteId, validatedData.referredUserId]);
    const existingReferral = existingReferralResult.rows[0];

    if (!existingReferral) {
      await executeQuery('INSERT INTO referrals (invite_id, inviter_id, referred_user_id, status) VALUES (?, ?, ?, ?)', [validatedData.inviteId, invite.inviter_id, validatedData.referredUserId, 'active']);
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

      const existingCodeResult = await executeQuery('SELECT id FROM ephemeral_codes WHERE code_hash = ?', [codeHash]);
      const existingCode = existingCodeResult.rows[0];

      if (!existingCode) break;

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json({ success: false, error: 'Failed to generate unique code' }, { status: 500 });
    }

    // Calculate expiry time
    const expiresAt = calculateExpiryTime(5); // 5 minutes

    // Insert the code
    await executeQuery('INSERT INTO ephemeral_codes (code_hash, salt, invite_id, referred_user_id, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)', [codeHash, salt, validatedData.inviteId, validatedData.referredUserId, expiresAt, 'ACTIVE']);

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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
