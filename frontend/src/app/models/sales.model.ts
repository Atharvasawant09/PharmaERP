import { ApiResponse } from './user.model';  // Add this import

export interface SalesItem {
  productId: string;
  productName?: string;
  quantity: number;
  rate: number;
  lineTotal: number;
}

export interface CreateSaleRequest {
  customerId: string;
  paymentType: 'Cash' | 'Card' | 'UPI';
  items: SalesItem[];
}

export interface SalesHeader {
  SalesId: string;
  SalesDate: string;
  TotalAmount: number;
  PaymentType: string;
  CustomerName: string;
  Mobile: string;
}

// Re-export ApiResponse
export type { ApiResponse };
