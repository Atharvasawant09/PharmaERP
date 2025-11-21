import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models/product.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  userRole: string = '';
  currentUser: any = null;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  searchTerm = '';
  canModify = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.authService.getUserRole() || '';
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data;
          this.filteredProducts = this.products;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.toastr.error('Failed to load products', 'Error');
        this.loading = false;
      }
    });
  }

  /**
   * Delete product by ID
   */
  deleteProduct(productId: string): void {
    if (!this.canDeleteProducts()) {
      this.toastr.error('You do not have permission to delete products', 'Access Denied');
      return;
    }

    // Find the product to get its name for confirmation
    const product = this.products.find(p => p.ProductId === productId);
    if (!product) {
      this.toastr.error('Product not found', 'Error');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${product.ProductName}"?`)) {
      return;
    }

    this.productService.deleteProduct(productId).subscribe({
      next: (response) => {
        this.toastr.success('Product deleted successfully', 'Success');
        this.loadProducts(); // Reload list
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Failed to delete product';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.ProductName.toLowerCase().includes(term) ||
      product.Composition?.toLowerCase().includes(term) ||
      product.BatchNo.toLowerCase().includes(term)
    );
  }

  getStockClass(stockQty: number): string {
    if (stockQty === 0) return 'badge bg-danger';
    if (stockQty < 50) return 'badge bg-warning';
    return 'badge bg-success';
  }

  isExpiringSoon(expiryDate: string): boolean {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    return expiry <= threeMonthsLater && expiry >= today;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Check if user can create products
   */
  canCreateProducts(): boolean {
    return ['Admin', 'Manager'].includes(this.userRole);
  }

  /**
   * Check if user can edit products
   */
  canEditProducts(): boolean {
    return ['Admin', 'Manager'].includes(this.userRole);
  }

  /**
   * Check if user can delete products
   */
  canDeleteProducts(): boolean {
    return this.userRole === 'Admin';
  }
}
