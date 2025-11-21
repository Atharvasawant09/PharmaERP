import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  loading = false;
  submitting = false;
  isEditMode = false;
  productId: string | null = null;
  pageTitle = 'Add New Product';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.maxLength(200)]],
      batchNo: ['', [Validators.required, Validators.maxLength(50)]],
      expiryDate: ['', Validators.required],
      composition: ['', Validators.maxLength(500)],
     mrp: [
  0,
  [
    Validators.required,
    Validators.min(0.01),
    Validators.pattern(/^\d+(\.\d{1,2})?$/)
  ]  
],
      stockQty: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.pageTitle = 'Edit Product';
      this.loadProduct();
    }
  }

  loadProduct(): void {
    if (!this.productId) return;

    this.loading = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (response) => {
        if (response.success) {
          const product = response.data;
          this.productForm.patchValue({
            productName: product.ProductName,
            batchNo: product.BatchNo,
            expiryDate: this.formatDateForInput(product.ExpiryDate),
            composition: product.Composition,
            mrp: product.MRP,
            stockQty: product.StockQty
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.toastr.error('Failed to load product', 'Error');
        this.loading = false;
      }
    });
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }
    const v = this.productForm.value;
    v.mrp = Number(Number(v.mrp).toFixed(2))

    this.submitting = true;
    const formData = this.productForm.value;

    if (this.isEditMode && this.productId) {
      this.updateProduct(formData);
    } else {
      this.createProduct(formData);
    }
  }

  createProduct(data: any): void {
    this.productService.createProduct(data).subscribe({
      next: (response) => {
        this.toastr.success('Product created successfully', 'Success');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.submitting = false;
        const errorMessage = error.error?.message || 'Failed to create product';
        this.toastr.error(errorMessage, 'Error');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  updateProduct(data: any): void {
    if (!this.productId) return;

    this.productService.updateProduct(this.productId, data).subscribe({
      next: (response) => {
        this.toastr.success('Product updated successfully', 'Success');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.submitting = false;
        const errorMessage = error.error?.message || 'Failed to update product';
        this.toastr.error(errorMessage, 'Error');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  // Getters for form controls
  get productName() { return this.productForm.get('productName'); }
  get batchNo() { return this.productForm.get('batchNo'); }
  get expiryDate() { return this.productForm.get('expiryDate'); }
  get composition() { return this.productForm.get('composition'); }
  get mrp() { return this.productForm.get('mrp'); }
  get stockQty() { return this.productForm.get('stockQty'); }
}
