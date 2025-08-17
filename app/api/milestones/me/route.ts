import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithRequest } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, {
    maxRequests: 20,
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
      console.error('Milestones API error:', userError || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 500 }
      );
    }
    
    // Get user's current points
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get all active milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select(`
        id,
        name,
        description,
        points_required,
        reward_description,
        is_active,
        created_at
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
        created_at
      `)
      .eq('user_id', user.id);

    if (awardsError) {
      console.error('Error fetching awards:', awardsError);
      return NextResponse.json(
        { error: 'Failed to fetch milestone awards' },
        { status: 500 }
      );
    }

    // Calculate milestone progress and status
    const milestoneProgress = milestones.map(milestone => {
      const award = awards.find(a => a.milestone_id === milestone.id);
      const isUnlocked = award?.status === 'UNLOCKED';
      const isInProgress = !isUnlocked && profile.points > 0;
      const progress = Math.min((profile.points / milestone.points_required) * 100, 100);
      const pointsNeeded = Math.max(0, milestone.points_required - profile.points);
      
      return {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        points_required: milestone.points_required,
        reward_description: milestone.reward_description,
        is_active: milestone.is_active,
        status: isUnlocked ? 'UNLOCKED' : isInProgress ? 'IN_PROGRESS' : 'LOCKED',
        is_unlocked: isUnlocked,
        unlocked_at: award?.unlocked_at || null,
        progress: Math.round(progress),
        points_needed: pointsNeeded,
        current_points: profile.points,
        created_at: milestone.created_at
      };
    });

    // Get recently unlocked milestones
    const recentUnlocks = awards
      .filter(a => a.status === 'UNLOCKED')
      .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
      .slice(0, 5);

    // Get next milestone
    const nextMilestone = milestoneProgress
      .filter(m => m.status === 'LOCKED')
      .sort((a, b) => a.points_required - b.points_required)[0];

    // Calculate overall progress
    const unlockedCount = milestoneProgress.filter(m => m.is_unlocked).length;
    const totalMilestones = milestoneProgress.length;
    const overallProgress = totalMilestones > 0 ? (unlockedCount / totalMilestones) * 100 : 0;

    // Get achievement statistics
    const stats = {
      total_milestones: totalMilestones,
      unlocked_milestones: unlockedCount,
      locked_milestones: totalMilestones - unlockedCount,
      overall_progress: Math.round(overallProgress),
      current_points: profile.points,
      highest_milestone: milestoneProgress
        .filter(m => m.is_unlocked)
        .sort((a, b) => b.points_required - a.points_required)[0] || null
    };

    return NextResponse.json({
      success: true,
      data: {
        milestones: milestoneProgress,
        next_milestone: nextMilestone ? {
          name: nextMilestone.name,
          points_required: nextMilestone.points_required,
          points_needed: nextMilestone.points_needed,
          progress: nextMilestone.progress
        } : null,
        recent_unlocks: recentUnlocks.map(award => {
          const milestone = milestoneProgress.find(m => m.id === award.milestone_id);
          return {
            milestone_id: award.milestone_id,
            name: milestone?.name || 'Unknown',
            description: milestone?.description || '',
            reward: milestone?.reward_description || '',
            unlocked_at: award.unlocked_at,
            points_required: milestone?.points_required || 0
          };
        }),
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Milestones API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
