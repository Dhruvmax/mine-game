import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ResponseHelper } from '@/lib/utils/response';

export function withValidation<T extends z.ZodSchema>(schema: T) {
  return async (request: NextRequest, handler: (data: z.infer<T>) => Promise<Response>) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return await handler(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError('Invalid input data', error.errors);
      }
      if (error instanceof SyntaxError) {
        return ResponseHelper.validationError('Invalid JSON format');
      }
      return ResponseHelper.internalError('Validation failed');
    }
  };
}

export function withQueryValidation<T extends z.ZodSchema>(schema: T) {
  return async (request: NextRequest, handler: (data: z.infer<T>) => Promise<Response>) => {
    try {
      const { searchParams } = new URL(request.url);
      const queryData = Object.fromEntries(searchParams.entries());
      const validatedData = schema.parse(queryData);
      return await handler(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError('Invalid query parameters', error.errors);
      }
      return ResponseHelper.internalError('Query validation failed');
    }
  };
}

export async function validateRequestBody<T>(request: NextRequest, schema: z.ZodSchema<T>): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        details: error.errors
      };
    }
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'INVALID_JSON',
        details: 'Request body must be valid JSON'
      };
    }
    return {
      success: false,
      error: 'VALIDATION_FAILED',
      details: 'Failed to validate request body'
    };
  }
}

export function validateQueryParams<T>(request: NextRequest, schema: z.ZodSchema<T>): {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
} {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    
    // Convert string values to appropriate types for common cases
    const processedData: any = {};
    for (const [key, value] of Object.entries(queryData)) {
      // Try to convert to number if it looks like a number
      if (/^\d+$/.test(value)) {
        processedData[key] = parseInt(value, 10);
      } else if (/^\d*\.\d+$/.test(value)) {
        processedData[key] = parseFloat(value);
      } else if (value === 'true') {
        processedData[key] = true;
      } else if (value === 'false') {
        processedData[key] = false;
      } else {
        processedData[key] = value;
      }
    }
    
    const validatedData = schema.parse(processedData);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        details: error.errors
      };
    }
    return {
      success: false,
      error: 'VALIDATION_FAILED',
      details: 'Failed to validate query parameters'
    };
  }
}