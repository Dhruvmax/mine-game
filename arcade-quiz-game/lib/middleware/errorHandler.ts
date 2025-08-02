import { NextRequest, NextResponse } from 'next/server';
import { ResponseHelper, logApiRequest, logApiResponse } from '@/lib/utils/response';

export function withErrorHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    try {
      // Log incoming request
      logApiRequest(method, url);

      const response = await handler(request);
      
      // Log successful response
      const duration = Date.now() - startTime;
      logApiResponse(method, url, response.status, duration);
      
      return response;
    } catch (error: any) {
      // Log error
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] ${method} ${url} - ERROR (${duration}ms):`, error);

      // Handle different types of errors
      if (error.name === 'ValidationError') {
        return ResponseHelper.validationError('Validation failed', error.errors);
      }

      if (error.name === 'CastError') {
        return ResponseHelper.validationError('Invalid ID format');
      }

      if (error.code === 11000) {
        // MongoDB duplicate key error
        const field = Object.keys(error.keyPattern || {})[0];
        return ResponseHelper.conflict(`Duplicate ${field}: this value already exists`);
      }

      if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
        return ResponseHelper.internalError('Database connection error');
      }

      // Custom application errors
      if (error.message === 'Team name already exists') {
        return ResponseHelper.conflict('This team name has already been used! Please choose a different team name.');
      }

      if (error.message === 'Game session not found') {
        return ResponseHelper.notFound('Game session not found');
      }

      if (error.message === 'Not eligible for mine game') {
        return ResponseHelper.forbidden('Quiz score not sufficient for mine game');
      }

      if (error.message === 'Invalid access code') {
        return ResponseHelper.validationError('Invalid access code! Try again.');
      }

      // Generic error handling
      return ResponseHelper.internalError(
        process.env.NODE_ENV === 'development' 
          ? error.message || 'An unexpected error occurred'
          : 'An unexpected error occurred'
      );
    }
  };
}

export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request);

    // Add CORS headers to all responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

export function withLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url).pathname;
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown';

    console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] ${method} ${url} - ERROR (${duration}ms):`, error);
      throw error;
    }
  };
}

export function withRateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key);
        }
      }

      // Get or create request count for this IP
      const requestData = requests.get(ip) || { count: 0, resetTime: now + windowMs };

      // Check if limit exceeded
      if (requestData.count >= maxRequests && requestData.resetTime > now) {
        return ResponseHelper.error(
          'RATE_LIMIT_EXCEEDED',
          'Too many requests. Please try again later.',
          429,
          {
            retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
          }
        );
      }

      // Reset counter if window has passed
      if (requestData.resetTime <= now) {
        requestData.count = 0;
        requestData.resetTime = now + windowMs;
      }

      // Increment counter
      requestData.count++;
      requests.set(ip, requestData);

      // Add rate limit headers
      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (maxRequests - requestData.count).toString());
      response.headers.set('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

      return response;
    };
  };
}