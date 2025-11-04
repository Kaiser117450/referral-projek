// app/api/health/route.ts - Health check endpoint for Docker
import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/turso';

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const dbHealthy = await healthCheck();
    
    if (!dbHealthy) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        }, 
        { status: 503 }
      );
    }

    // Check environment variables
    const requiredEnvVars = [
      'TURSO_DATABASE_URL',
      'TURSO_AUTH_TOKEN',
      'NEXTAUTH_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: `Missing environment variables: ${missingEnvVars.join(', ')}`,
          timestamp: new Date().toISOString()
        }, 
        { status: 503 }
      );
    }

    // All checks passed
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: 'connected',
      storage: 'available'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}