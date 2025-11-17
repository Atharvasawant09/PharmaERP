export interface Customer {
  CustomerId: string;
  CustomerName: string;
  Mobile: string | null;
  Email: string | null;
  CreatedAt: Date;
}

export interface CreateCustomerRequest {
  customerName: string;
  mobile?: string;
  email?: string;
}
