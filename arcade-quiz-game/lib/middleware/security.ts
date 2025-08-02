import { NextRequest, NextResponse } from 'next/server';
import { ResponseHelper } from '@/lib/utils/response';

export function withSecurityHeaders(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production' && request.url.startsWith('https://')) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  };
}

export function withAdminAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const adminCode = process.env.ADMIN_ACCESS_CODE || 'techteammode';
    const authHeader = request.headers.get('authorization');
    const providedCode = request.headers.get('x-admin-code');

    // Check for admin code in headers
    if (providedCode !== adminCode) {
      return ResponseHelper.unauthorized('Admin access required');
    }

    return await handler(request);
  };
}

export function withApiKeyAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const apiKey = process.env.API_SECRET_KEY;
    const providedKey = request.headers.get('x-api-key');

    if (!apiKey) {
      console.warn('API_SECRET_KEY not configured');
      return await handler(request); // Allow if not configured (development)
    }

    if (providedKey !== apiKey) {
      return ResponseHelper.unauthorized('Invalid API key');
    }

    return await handler(request);
  };
}

export function withInputSanitization(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // For POST/PUT requests, sanitize the body
    if (request.method === 'POST' || request.method === 'PUT') {
      try {
        const body = await request.json();
        const sanitizedBody = sanitizeObject(body);
        
        // Create a new request with sanitized body
        const sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedBody),
        });

        return await handler(sanitizedRequest);
      } catch (error) {
        // If JSON parsing fails, continue with original request
        return await handler(request);
      }
    }

    return await handler(request);
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeValue(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }

  return sanitized;
}

function sanitizeValue(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove potentially dangerous characters and patterns
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

export function withRequestSizeLimit(maxSizeBytes: number = 1024 * 1024) { // 1MB default
  return function(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const contentLength = request.headers.get('content-length');
      
      if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        return ResponseHelper.error(
          'REQUEST_TOO_LARGE',
          `Request body too large. Maximum size is ${maxSizeBytes} bytes.`,
          413
        );
      }

      return await handler(request);
    };
  };
}

export function withMethodValidation(allowedMethods: string[]) {
  return function(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      if (!allowedMethods.includes(request.method)) {
        return ResponseHelper.error(
          'METHOD_NOT_ALLOWED',
          `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
          405
        );
      }

      return await handler(request);
    };
  };
}

// Compose multiple middleware functions
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}