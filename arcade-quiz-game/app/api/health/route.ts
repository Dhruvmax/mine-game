import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import GameSession from '@/lib/models/GameSession';
import { ResponseHelper } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // Database connectivity check
    let dbHealth = {
      status: 'unknown',
      responseTime: 0,
      error: null as string | null
    };

    try {
      const dbStartTime = Date.now();
      await connectDB();
      
      // Simple query to test database
      await Team.countDocuments().limit(1);
      
      dbHealth = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
        error: null
      };
    } catch (error: any) {
      dbHealth = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }

    // System metrics
    const memoryUsage = process.memoryUsage();
    const systemMetrics = {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      uptime: Math.round(process.uptime()),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    };

    // Overall health status
    const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'degraded';
    const responseTime = Date.now() - startTime;

    const healthCheck = {
      ...health,
      status: overallStatus,
      responseTime,
      checks: {
        database: dbHealth,
        system: systemMetrics
      }
    };

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    return NextResponse.json({
      success: overallStatus === 'healthy',
      data: healthCheck
    }, { status: statusCode });

  } catch (error: any) {
    console.error('Health check error:', error);

    return NextResponse.json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error.message,
        checks: {
          database: {
            status: 'unhealthy',
            error: error.message
          }
        }
      }
    }, { status: 503 });
  }
}

// Detailed health check for admin/monitoring
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    await connectDB();

    // Get database statistics
    const [
      totalTeams,
      totalSessions,
      activeSessions,
      completedSessions,
      recentActivity
    ] = await Promise.all([
      Team.countDocuments(),
      GameSession.countDocuments(),
      GameSession.countDocuments({ status: 'active' }),
      GameSession.countDocuments({ status: { $in: ['mine_completed', 'finished'] } }),
      GameSession.find()
        .sort({ startedAt: -1 })
        .limit(5)
        .populate('teamId', 'teamName difficulty')
    ]);

    const dbStats = {
      collections: {
        teams: totalTeams,
        sessions: totalSessions,
        activeSessions,
        completedSessions
      },
      recentActivity: recentActivity.map(session => ({
        teamName: (session.teamId as any)?.teamName,
        difficulty: (session.teamId as any)?.difficulty,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt
      }))
    };

    // System performance metrics
    const memoryUsage = process.memoryUsage();
    const systemMetrics = {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        heapUsedPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      uptime: process.uptime(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage()
    };

    // Environment info
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      mongodbConnected: true,
      mongodbUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
      mongodbDbName: process.env.MONGODB_DB_NAME || 'not configured'
    };

    const responseTime = Date.now() - startTime;

    return ResponseHelper.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      database: dbStats,
      system: systemMetrics,
      environment
    });

  } catch (error: any) {
    console.error('Detailed health check error:', error);

    return ResponseHelper.error(
      'HEALTH_CHECK_FAILED',
      'Detailed health check failed',
      503,
      {
        error: error.message,
        responseTime: Date.now() - startTime
      }
    );
  }
}