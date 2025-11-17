import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SalesService } from '../../../services/sales.service';
import { SalesHeader } from '../../../models/sales.model';
import { ToastrService } from 'ngx-toastr';
import { PdfService } from '../../../services/pdf.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sales-history.component.html',
  styleUrls: ['./sales-history.component.scss']
})
export class SalesHistoryComponent implements OnInit {
  sales: SalesHeader[] = [];
  filteredSales: SalesHeader[] = [];
  loading = true;
  searchTerm = '';
  filterPaymentType = 'all';

  startDate = '';
  endDate = '';

  totalSales = 0;
  totalRevenue = 0;
  cashSales = 0;
  cardSales = 0;
  upiSales = 0;

  selectedSale: any = null;
  showDetailsModal = false;

  constructor(
    private salesService: SalesService,
    private router: Router,
    private toastr: ToastrService,
      private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];

    this.loadSales();
  }

  loadSales(): void {
    this.loading = true;
    this.salesService.getAllSales().subscribe({
      next: (response) => {
        if (response.success) {
          this.sales = response.data.map(sale => ({
            ...sale,
            TotalAmount: this.toNumber(sale.TotalAmount)
          }));
          this.applyFilters();
          this.calculateSummary();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sales:', error);
        this.toastr.error('Failed to load sales history', 'Error');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.sales];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.CustomerName.toLowerCase().includes(search) ||
        sale.Mobile?.toLowerCase().includes(search) ||
        sale.PaymentType.toLowerCase().includes(search)
      );
    }

    if (this.filterPaymentType !== 'all') {
      filtered = filtered.filter(sale =>
        sale.PaymentType.toLowerCase() === this.filterPaymentType.toLowerCase()
      );
    }

    if (this.startDate) {
      filtered = filtered.filter(sale =>
        new Date(sale.SalesDate) >= new Date(this.startDate)
      );
    }

    if (this.endDate) {
      const endDateTime = new Date(this.endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sale =>
        new Date(sale.SalesDate) <= endDateTime
      );
    }

    this.filteredSales = filtered;
  }

  calculateSummary(): void {
    this.totalSales = this.filteredSales.length;
    this.totalRevenue = this.filteredSales.reduce((sum, sale) => sum + this.toNumber(sale.TotalAmount), 0);

    this.cashSales = this.filteredSales
      .filter(s => s.PaymentType === 'Cash')
      .reduce((sum, s) => sum + this.toNumber(s.TotalAmount), 0);

    this.cardSales = this.filteredSales
      .filter(s => s.PaymentType === 'Card')
      .reduce((sum, s) => sum + this.toNumber(s.TotalAmount), 0);

    this.upiSales = this.filteredSales
      .filter(s => s.PaymentType === 'UPI')
      .reduce((sum, s) => sum + this.toNumber(s.TotalAmount), 0);
  }

  // Add this method:
downloadInvoice(sale: SalesHeader): void {
  this.salesService.getSaleById(sale.SalesId).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.pdfService.generateSaleInvoice(response.data);
        this.toastr.success('Invoice downloaded successfully', 'Download Complete');
      } else {
        this.toastr.error('Sale data not found', 'Error');
      }
    },
    error: (error) => {
      console.error('Error downloading invoice:', error);
      this.toastr.error('Failed to download invoice', 'Error');
    }
  });
}

downloadCurrentInvoice(): void {
  if (this.selectedSale) {
    this.pdfService.generateSaleInvoice(this.selectedSale);
    this.toastr.success('Invoice downloaded successfully', 'Download Complete');
  }
}

  onSearchChange(): void {
    this.applyFilters();
    this.calculateSummary();
  }

  onFilterChange(): void {
    this.applyFilters();
    this.calculateSummary();
  }

  viewSaleDetails(sale: SalesHeader): void {
    this.salesService.getSaleById(sale.SalesId).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedSale = response.data;
          this.showDetailsModal = true;
        }
      },
      error: (error) => {
        console.error('Error loading sale details:', error);
        this.toastr.error('Failed to load sale details', 'Error');
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedSale = null;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentBadgeClass(paymentType: string): string {
    switch (paymentType) {
      case 'Cash': return 'badge bg-success';
      case 'Card': return 'badge bg-primary';
      case 'UPI': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  // Helper method to convert to number
  toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  exportToCSV(): void {
    const headers = ['Date', 'Customer', 'Mobile', 'Payment Type', 'Amount'];
    const rows = this.filteredSales.map(sale => [
      this.formatDate(sale.SalesDate),
      sale.CustomerName,
      sale.Mobile || '',
      sale.PaymentType,
      this.toNumber(sale.TotalAmount).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastr.success('Sales history exported successfully', 'Export Complete');
  }
}
