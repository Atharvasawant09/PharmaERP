import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { SalesService } from '../../services/sales.service';
import { ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OnDestroy } from '@angular/core';



Chart.register(...registerables);



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit,AfterViewInit,OnDestroy {
  @ViewChild('salesChart') salesChart?: ElementRef<HTMLCanvasElement>;
@ViewChild('topProductsChart') topProductsChart?: ElementRef<HTMLCanvasElement>;

private chart?: Chart;
private pieChart?: Chart;

  currentUser$;
  totalProducts = 0;
  lowStockProducts = 0;
  expiringProducts = 0;
  loading = true;

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private salesService: SalesService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
  // Wait a bit for data to load
  setTimeout(() => {
    this.createCharts();
  }, 1000);
}

createCharts(): void {
  this.createSalesChart();
  this.createTopProductsChart();
}

createSalesChart(): void {
  if (!this.salesChart) return;

  const ctx = this.salesChart.nativeElement.getContext('2d');
  if (!ctx) return;

  // Load real weekly sales data
  this.salesService.getWeeklySales().subscribe({
    next: (response) => {
      if (response.success) {
        const labels = response.data.map((d: any) => d.day);
        const data = response.data.map((d: any) => d.sales);

        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Daily Sales (₹)',
              data: data,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Weekly Sales Trend'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '₹' + value;
                  }
                }
              }
            }
          }
        });
      }
    },
    error: (error) => {
      console.error('Error loading weekly sales:', error);
      // Fallback to empty chart
      this.createEmptySalesChart(ctx);
    }
  });
}

createTopProductsChart(): void {
  if (!this.topProductsChart) return;

  const ctx = this.topProductsChart.nativeElement.getContext('2d');
  if (!ctx) return;

  // Load real top products data
  this.salesService.getTopProducts().subscribe({
    next: (response) => {
      if (response.success && response.data.length > 0) {
        const labels = response.data.map((d: any) => d.ProductName);
        const data = response.data.map((d: any) => d.totalQuantity);
        const colors = [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ];

        this.pieChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors.slice(0, data.length)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right' },
              title: {
                display: true,
                text: 'Top Selling Products (by Quantity)'
              }
            }
          }
        });
      } else {
        // No sales data yet - show placeholder
        this.createEmptyProductsChart(ctx);
      }
    },
    error: (error) => {
      console.error('Error loading top products:', error);
      this.createEmptyProductsChart(ctx);
    }
  });
}

// Fallback for empty data
private createEmptySalesChart(ctx: CanvasRenderingContext2D): void {
  this.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Daily Sales (₹)',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(200, 200, 200, 0.3)',
        borderColor: 'rgba(200, 200, 200, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'No Sales Data Yet' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

private createEmptyProductsChart(ctx: CanvasRenderingContext2D): void {
  this.pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['No Data'],
      datasets: [{
        data: [1],
        backgroundColor: ['rgba(200, 200, 200, 0.3)']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'No Sales Data Yet' }
      }
    }
  });
}


ngOnDestroy(): void {
  if (this.chart) {
    this.chart.destroy();
  }
  if (this.pieChart) {
    this.pieChart.destroy();
  }
}

todaySales = 0;
  loadDashboardData(): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success) {
          const products: Product[] = response.data;
          this.totalProducts = products.length;
          this.lowStockProducts = products.filter((p: Product) => p.StockQty < 50).length;
          this.expiringProducts = this.getExpiringCount(products);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });

    // Add sales loading
  this.salesService.getTodaySummary().subscribe({
    next: (response) => {
      if (response.success) {
        this.todaySales = response.data.totalSales;
      }
    },
    error: (error) => {
      console.error('Error loading sales summary:', error);
    }
  });
  }

  getExpiringCount(products: Product[]): number {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    return products.filter(p => {
      const expiryDate = new Date(p.ExpiryDate);
      return expiryDate <= threeMonthsLater && expiryDate >= today;
    }).length;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  

  logout(): void {
    this.authService.logout();
  }
}
