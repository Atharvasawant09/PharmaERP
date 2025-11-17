import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreateSaleRequest, SalesHeader, ApiResponse } from '../models/sales.model';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  createSale(sale: CreateSaleRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, sale);
  }

  getAllSales(): Observable<ApiResponse<SalesHeader[]>> {
    return this.http.get<ApiResponse<SalesHeader[]>>(this.apiUrl);
  }

  getSaleById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getTodaySummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/summary/today`);
  }

  getWeeklySales(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/weekly`);
  }

  getTopProducts(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/top-products`);
  }
}
