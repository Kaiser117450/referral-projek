import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const codeRevokeSchema = z.object({
  code_id: z.string().uuid(),
  reason: z.string().min(1).max(500)
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
    const status = searchParams.get('status') || '';
    const user_id = searchParams.get('user_id') || '';
    const date_from = searchParams.get('date_from') || '';
    const date_to = searchParams.get('date_to') || '';
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('ephemeral_codes')
      .select(`
        id,
        user_id,
        status,
        expires_at,
        created_at,
        updated_at,
        profiles!inner(
          email,
          full_name,
          user_role
        ),
        referrals!inner(
          invitee_email,
          invites!inner(
            title,
            slug
          )
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to);
    }
    
    // Get total count
    const { count } = await query;
    
    // Get paginated results
    const { data: codes, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching codes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch codes' },
        { status: 500 }
      );
    }
    
    // Get statistics
    const { data: stats } = await supabase
      .from('ephemeral_codes')
      .select('status, created_at');
    
    const statusStats = {
      total: stats?.length || 0,
      active: stats?.filter(c => c.status === 'ACTIVE').length || 0,
      used: stats?.filter(c => c.status === 'USED').length || 0,
      expired: stats?.filter(c => c.status === 'EXPIRED').length || 0,
      revoked: stats?.filter(c => c.status === 'REVOKED').length || 0
    };
    
    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('ephemeral_codes')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        profiles!inner(
          email,
          full_name
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      success: true,
      data: {
        codes: codes || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        },
        statistics: statusStats,
        recent_activity: recentActivity || []
      }
    });
    
  } catch (error) {
    console.error('Admin codes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    
    const validatedData = codeRevokeSchema.parse(body);
    
    // Get the code details before revoking
    const { data: code, error: fetchError } = await supabase
      .from('ephemeral_codes')
      .select(`
        id,
        user_id,
        status,
        profiles!inner(
          email,
          full_name
        )
      `)
      .eq('id', validatedData.code_id)
      .single();
    
    if (fetchError || !code) {
      return NextResponse.json(
        { error: 'Code not found' },
        { status: 404 }
      );
    }
    
    // Check if code can be revoked
    if (code.status === 'USED') {
      return NextResponse.json(
        { error: 'Cannot revoke already used codes' },
        { status: 400 }
      );
    }
    
    if (code.status === 'REVOKED') {
      return NextResponse.json(
        { error: 'Code is already revoked' },
        { status: 400 }
      );
    }
    
    // Revoke the code
    const { data: revokedCode, error: revokeError } = await supabase
      .from('ephemeral_codes')
      .update({
        status: 'REVOKED',
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.code_id)
      .select()
      .single();
    
    if (revokeError) {
      console.error('Error revoking code:', revokeError);
      return NextResponse.json(
        { error: 'Failed to revoke code' },
        { status: 500 }
      );
    }
    
    // Log the revocation
    await supabase
      .from('audit_logs')
      .insert({
        user_id: code.user_id,
        action: 'CODE_REVOKED',
        details: {
          code_id: validatedData.code_id,
          reason: validatedData.reason,
          previous_status: code.status,
          revoked_by: (await requireAdmin()).user.id
        },
        ip_address: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      });
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Code revoked successfully',
        code: revokedCode
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Admin code revoke error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    
    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('ephemeral_codes')
      .select(`
        status,
        created_at,
        user_id,
        profiles!inner(
          user_role
        )
      `);
    
    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
    
    // Calculate analytics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const analyticsData = {
      total_codes: analytics?.length || 0,
      codes_last_24h: analytics?.filter(c => new Date(c.created_at) >= last24h).length || 0,
      codes_last_7d: analytics?.filter(c => new Date(c.created_at) >= last7d).length || 0,
      codes_last_30d: analytics?.filter(c => new Date(c.created_at) >= last30d).length || 0,
      by_status: {
        active: analytics?.filter(c => c.status === 'ACTIVE').length || 0,
        used: analytics?.filter(c => c.status === 'USED').length || 0,
        expired: analytics?.filter(c => c.status === 'EXPIRED').length || 0,
        revoked: analytics?.filter(c => c.status === 'REVOKED').length || 0
      },
      by_user_role: {
        users: analytics?.filter(c => c.profiles?.user_role === 'user').length || 0,
        cashiers: analytics?.filter(c => c.profiles?.user_role === 'cashier').length || 0,
        admins: analytics?.filter(c => c.profiles?.user_role === 'admin').length || 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Admin codes analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
