import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Customer, CreateCustomerRequest,ApiResponse} from '../models/customer.model';
// import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getAllCustomers(): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl);
  }

  createCustomer(customer: CreateCustomerRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, customer);
  }
}
