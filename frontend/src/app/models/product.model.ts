import { ApiResponse } from './user.model';

export interface Product {
  ProductId: string;
  ProductName: string;
  BatchNo: string;
  ExpiryDate: string;
  Composition: string | null;
  MRP: number;
  StockQty: number;
  IsActive: boolean;
  CreatedAt: string;
}

export interface CreateProductRequest {
  productName: string;
  batchNo: string;
  expiryDate: string;
  composition?: string;
  mrp: number;
  stockQty: number;
}

export interface UpdateProductRequest {
  productName?: string;
  batchNo?: string;
  expiryDate?: string;
  composition?: string;
  mrp?: number;
  stockQty?: number;
}

export type { ApiResponse };
