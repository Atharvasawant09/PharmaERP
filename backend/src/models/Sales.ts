export interface SalesHeader {
  SalesId: string;
  CustomerId: string;
  PaymentType: 'Cash' | 'Card' | 'UPI';
  TotalAmount: number;
  SalesDate: Date;
  CreatedBy: string;
}

export interface SalesLine {
  SalesLineId: string;
  SalesId: string;
  ProductId: string;
  Quantity: number;
  Rate: number;
  LineTotal: number;
}

export interface CreateSaleRequest {
  customerId: string;
  paymentType: 'Cash' | 'Card' | 'UPI';
  items: {
    productId: string;
    quantity: number;
    rate: number;
  }[];
}
