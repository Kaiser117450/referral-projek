import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const userRoleUpdateSchema = z.object({
  user_id: z.string().uuid(),
  user_role: z.enum(['user', 'cashier', 'admin']),
  is_active: z.boolean().optional()
});

const userBanSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  is_permanent: z.boolean().default(false)
});

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, {
    maxRequests: 50,
    windowMs: 60000 // 1 minute
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { supabase } = await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        user_role,
        points,
        is_active,
        created_at,
        updated_at,
        last_login_at
      `, { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('user_role', role);
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    // Get total count
    const { count } = await query;
    
    // Get paginated results
    const { data: users, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    // Get additional statistics
    const { data: stats } = await supabase
      .from('profiles')
      .select('user_role, is_active')
      .eq('is_active', true);
    
    const roleStats = {
      total: stats?.length || 0,
      users: stats?.filter(u => u.user_role === 'user').length || 0,
      cashiers: stats?.filter(u => u.user_role === 'cashier').length || 0,
      admins: stats?.filter(u => u.user_role === 'admin').length || 0
    };
    
    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        },
        statistics: roleStats
      }
    });
    
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, {
    maxRequests: 20,
    windowMs: 60000 // 1 minute
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { supabase } = await requireAdmin();
    const body = await req.json();
    
    const validatedData = userRoleUpdateSchema.parse(body);
    
    // Prevent admin from changing their own role
    const { user } = await requireAdmin();
    if (user.id === validatedData.user_id) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      );
    }
    
    // Update user role
    const { data, error } = await supabase
      .from('profiles')
      .update({
        user_role: validatedData.user_role,
        is_active: validatedData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.user_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'User updated successfully',
        user: data
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(req, {
    maxRequests: 10,
    windowMs: 60000 // 1 minute
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { supabase } = await requireAdmin();
    const body = await req.json();
    
    const validatedData = userBanSchema.parse(body);
    
    // Prevent admin from banning themselves
    const { user } = await requireAdmin();
    if (user.id === validatedData.user_id) {
      return NextResponse.json(
        { error: 'Cannot ban yourself' },
        { status: 400 }
      );
    }
    
    // Soft delete/ban user
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.user_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error banning user:', error);
      return NextResponse.json(
        { error: 'Failed to ban user' },
        { status: 500 }
      );
    }
    
    // Log the ban action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: validatedData.user_id,
        action: 'USER_BANNED',
        details: {
          reason: validatedData.reason,
          is_permanent: validatedData.is_permanent,
          banned_by: user.id
        },
        ip_address: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      });
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'User banned successfully',
        user: data
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Admin user ban error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
