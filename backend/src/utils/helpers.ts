import { v4 as uuidv4 } from 'uuid';

// Generate UUID
export function generateUUID(): string {
  return uuidv4();
}

// Format date for MySQL
export function formatDateForMySQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Success response
export function successResponse(data: any, message = 'Success') {
  return {
    success: true,
    message,
    data
  };
}

// Error response
export function errorResponse(message: string, statusCode = 400) {
  return {
    success: false,
    message,
    statusCode
  };
}
