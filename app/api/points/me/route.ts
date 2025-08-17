import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithRequest } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';

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
    const supabase = createServerClientWithRequest(req);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Points API error:', userError || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user's current points and profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get points history from redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select(`
        points_awarded,
        created_at,
        status,
        ephemeral_codes!inner(
          referrals!inner(
            invites!inner(
              title,
              description
            )
          )
        )
      `)
      .eq('ephemeral_codes.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (redemptionsError) {
      console.error('Error fetching redemptions:', redemptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch points history' },
        { status: 500 }
      );
    }

    // Get milestone progress
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select(`
        id,
        name,
        description,
        points_required,
        reward_description,
        is_active
      `)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    // Get user's milestone awards
    const { data: awards, error: awardsError } = await supabase
      .from('milestone_awards')
      .select(`
        milestone_id,
        status,
        unlocked_at,
        milestones!inner(
          name,
          description,
          points_required,
          reward_description
        )
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (awardsError) {
      console.error('Error fetching awards:', awardsError);
      return NextResponse.json(
        { error: 'Failed to fetch milestone awards' },
        { status: 500 }
      );
    }

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
          invite_title: r.ephemeral_codes?.referrals?.invites?.title || 'Unknown'
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
