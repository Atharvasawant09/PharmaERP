import { ApiResponse } from './user.model';  // Add this import

export interface Customer {
  CustomerId: string;
  CustomerName: string;
  Mobile: string | null;
  Email: string | null;
  CreatedAt: string;
}

export interface CreateCustomerRequest {
  customerName: string;
  mobile?: string;
  email?: string;
}

// Re-export ApiResponse if needed
export type { ApiResponse };
