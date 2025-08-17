import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithRequest } from '@/lib/supabase/server';
import { createInviteSchema, updateInviteSchema } from '@/lib/validation';
import { generateUniqueSlug } from '@/lib/utils';

// POST /api/referral/create-link
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClientWithRequest(request);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = createInviteSchema.parse(body);
    
    // Generate unique slug if not provided
    let slug = validatedData.slug;
    if (!slug) {
      slug = generateUniqueSlug();
    }
    
    // Check if slug already exists
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 409 }
      );
    }
    
    // Create invite
    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        inviter_id: user.id,
        slug,
        title: validatedData.title,
        description: validatedData.description,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating invite:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create invite' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: invite,
      message: 'Referral link created successfully',
    });
    
  } catch (error) {
    console.error('Error in create referral:', error);
    
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

// GET /api/referral/my-invites
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClientWithRequest(request);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user from server:', userError || 'No user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user's invites
    const { data: invites, error } = await supabase
      .from('invites')
      .select(`
        *,
        referrals:referrals(count)
      `)
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invites:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invites' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: invites,
    });
    
  } catch (error) {
    console.error('Error in get invites:', error);
    
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

// PUT /api/referral/update-invite
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClientWithRequest(request);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateInviteSchema.parse(body);
    
    // Check if user owns this invite
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id, inviter_id')
      .eq('id', validatedData.id)
      .single();
    
    if (!existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Invite not found' },
        { status: 404 }
      );
    }
    
    if (existingInvite.inviter_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Update invite
    const { data: invite, error } = await supabase
      .from('invites')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        is_active: validatedData.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating invite:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update invite' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: invite,
      message: 'Invite updated successfully',
    });
    
  } catch (error) {
    console.error('Error in update invite:', error);
    
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

// DELETE /api/referral/delete-invite/:id
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invite ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerClient();
    
    // Check if user owns this invite
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id, inviter_id')
      .eq('id', id)
      .single();
    
    if (!existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Invite not found' },
        { status: 404 }
      );
    }
    
    if (existingInvite.inviter_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('invites')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invite:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete invite' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invite deleted successfully',
    });
    
  } catch (error) {
    console.error('Error in delete invite:', error);
    
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
