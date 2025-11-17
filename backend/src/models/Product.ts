export interface Product {
  ProductId: string;
  ProductName: string;
  BatchNo: string;
  ExpiryDate: Date;
  Composition: string | null;
  MRP: number;
  StockQty: number;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface CreateProductRequest {
  productName: string;
  batchNo: string;
  expiryDate: string;
  composition?: string;
  mrp: number;
  stockQty: number;
}
