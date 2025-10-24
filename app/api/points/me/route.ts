import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/turso';
import { withRateLimit } from '@/lib/rate-limit';
// TODO: Replace with next-auth session management
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, {
    maxRequests: 30,
    windowMs: 60000 // 1 minute
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // TODO: Replace with next-auth session management
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    // }
    // const userId = session.user.id;
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // Hardcoded for now

    // Get user's current points and profile
    const profileResult = await executeQuery('SELECT points, created_at, updated_at FROM profiles WHERE id = ?', [userId]);
    const profile = profileResult.rows[0];

    if (!profile) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Get points history from redemptions
    const redemptionsResult = await executeQuery(`
      SELECT
        r.points_awarded,
        r.created_at,
        r.status,
        i.title as invite_title
      FROM redemptions r
      JOIN ephemeral_codes ec ON r.code_id = ec.id
      JOIN referrals ref ON ec.referral_id = ref.id
      JOIN invites i ON ref.invite_id = i.id
      WHERE ec.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `, [userId]);
    const redemptions = redemptionsResult.rows;

    // Get milestone progress
    const milestonesResult = await executeQuery(`
      SELECT
        id,
        name,
        description,
        points_required,
        reward_description,
        is_active
      FROM milestones
      WHERE is_active = 1
      ORDER BY points_required ASC
    `);
    const milestones = milestonesResult.rows;

    // Get user's milestone awards
    const awardsResult = await executeQuery(`
      SELECT
        milestone_id,
        status,
        unlocked_at
      FROM milestone_awards
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
    `, [userId]);
    const awards = awardsResult.rows;

    // Calculate milestone progress
    const milestoneProgress = milestones.map(milestone => {
      const award = awards.find(a => a.milestone_id === milestone.id);
      const isUnlocked = award?.status === 'UNLOCKED';
      const progress = Math.min((profile.points / milestone.points_required) * 100, 100);

      return {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        points_required: milestone.points_required,
        reward_description: milestone.reward_description,
        is_active: milestone.is_active,
        is_unlocked: isUnlocked,
        unlocked_at: award?.unlocked_at || null,
        progress: Math.round(progress)
      };
    });

    // Calculate next milestone
    const nextMilestone = milestoneProgress
      .filter(m => !m.is_unlocked && m.is_active)
      .sort((a, b) => a.points_required - b.points_required)[0];

    // Calculate points needed for next milestone
    const pointsToNext = nextMilestone
      ? Math.max(0, nextMilestone.points_required - profile.points)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        current_points: profile.points,
        total_points_earned: redemptions.reduce((sum, r) => sum + (r.points_awarded || 0), 0),
        points_history: redemptions.map(r => ({
          points: r.points_awarded,
          date: r.created_at,
          status: r.status,
          invite_title: r.invite_title || 'Unknown'
        })),
        milestone_progress: milestoneProgress,
        next_milestone: nextMilestone ? {
          name: nextMilestone.name,
          points_required: nextMilestone.points_required,
          points_needed: pointsToNext,
          progress: nextMilestone.progress
        } : null,
        profile_created: profile.created_at,
        last_updated: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Points API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
