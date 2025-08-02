import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export class ResponseHelper {
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message
    });
  }

  static error(
    error: string,
    message: string,
    status: number = 500,
    details?: any
  ): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error,
      message,
      details
    }, { status });
  }

  static validationError(message: string, details?: any): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'VALIDATION_ERROR',
      message,
      details
    }, { status: 400 });
  }

  static notFound(message: string = 'Resource not found'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'NOT_FOUND',
      message
    }, { status: 404 });
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'UNAUTHORIZED',
      message
    }, { status: 401 });
  }

  static forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'FORBIDDEN',
      message
    }, { status: 403 });
  }

  static conflict(message: string = 'Conflict'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'CONFLICT',
      message
    }, { status: 409 });
  }

  static internalError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message
    }, { status: 500 });
  }
}

export function handleApiError(error: any): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    return ResponseHelper.validationError('Validation failed', error.errors);
  }

  if (error.name === 'CastError') {
    return ResponseHelper.validationError('Invalid ID format');
  }

  if (error.code === 11000) {
    return ResponseHelper.conflict('Duplicate entry');
  }

  if (error.message === 'Team name already exists') {
    return ResponseHelper.conflict('This team name has already been used! Please choose a different team name.');
  }

  if (error.message === 'Game session not found') {
    return ResponseHelper.notFound('Game session not found');
  }

  if (error.message === 'Not eligible for mine game') {
    return ResponseHelper.forbidden('Quiz score not sufficient for mine game');
  }

  return ResponseHelper.internalError(error.message || 'An unexpected error occurred');
}

export function logApiRequest(method: string, url: string, body?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${url}`, body ? { body } : '');
}

export function logApiResponse(method: string, url: string, status: number, duration: number) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
}