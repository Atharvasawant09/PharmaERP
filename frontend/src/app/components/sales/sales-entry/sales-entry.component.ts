import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../services/customer.service';
import { ProductService } from '../../../services/product.service';
import { SalesService } from '../../../services/sales.service';
import { ToastrService } from 'ngx-toastr';
import { Customer } from '../../../models/customer.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-sales-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sales-entry.component.html',
  styleUrls: ['./sales-entry.component.scss']
})
export class SalesEntryComponent implements OnInit {
  salesForm: FormGroup;
  customerForm: FormGroup;  // ADD THIS
  customers: Customer[] = [];
  products: Product[] = [];
  loading = false;
  submitting = false;
  showCustomerModal = false;  // ADD THIS
  addingCustomer = false;   // ADD THIS
  private readonly var: any;
  Low_stock = 1;
  private readonly var1: any;
  sufficient_stock = 5;

  isOutOfStock(stockQty:number | null| undefined):boolean{
    return !stockQty || stockQty <=0;
  }

  isLowStock(stockQty:number | null| undefined):boolean{
    if(this.isOutOfStock(stockQty))
      return false;
    return (stockQty as number)< this.sufficient_stock
}

isSufficeientStock(stockQty:number | null| undefined):boolean{
  return (stockQty ?? 0)>= this.sufficient_stock
}
getStockBadgeClass(stockQty : number|null|undefined):string{
  if(this.isOutOfStock(stockQty)){
    return 'badge bg-secondary';
  }
  if(this.isLowStock(stockQty)){
    return 'badge bg-danger';}

  return 'badge bg-success';
}

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private productService: ProductService,
    private salesService: SalesService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.salesForm = this.fb.group({
      customerId: ['', Validators.required],
      paymentType: ['Cash', Validators.required],
      items: this.fb.array([])
    });

    // ADD CUSTOMER FORM
    this.customerForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.maxLength(200)]],
      mobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
    this.addItem();
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data as Product[];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  get items(): FormArray {
    return this.salesForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      rate: [{ value: 0, disabled: true }],
      lineTotal: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateTotal();
    }
  }

  onProductChange(index: number): void {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;

    if (productId) {
      const product = this.products.find(p => p.ProductId === productId);
      if (product) {
        item.patchValue({
          rate: product.MRP,
          lineTotal: product.MRP * item.get('quantity')?.value
        });
        this.calculateTotal();
      }
    }
  }

  onSelectProduct(index:number,productId:string):void{
    const product = this.products.find(p=>p.ProductId === productId);
    if(!product) return ;

    if(this.isOutOfStock(product.StockQty)){
      this.toastr.warning("product cannot be seleted");

      this.items.at(index).patchValue({
        productId:null,
        rate:0,
        quantity:null,
        lineTotal:0
      }, {emitEvent:false});
      return;
    }

    if (this.isLowStock(product.StockQty)){
      this.toastr.info("Low stock for this product");
    }

    this.items.at(index).patchValue({
      rate:product.MRP,
      quantity:1,
      lineTotal:product.MRP
    });


  }

  onQuantityChange(index: number): void {
    const group = this.items.at(index);
    const productId = group.get('productId')?.value as string | null;
    if(!productId) return;

    const product = this.products.find(p=>p.ProductId === productId);
    if(!product) return;

    let qty = Number(group.get('quantity')?.value||0);
    if(qty<=0) qty=1;

    if(qty > product.StockQty){
      qty = product.StockQty;
      this.toastr.warning(`only ${product.StockQty} unit(s) available`);
    }

    const rate = Number(group.get('rate')?.value || 0);
    group.patchValue({
      quantity:qty,
      lineTotal: Number((qty  * rate).toFixed(2))
    }, {emitEvent:false});
    this.calculateTotal?.();
  }

  calculateTotal(): number {
    return this.items.controls.reduce((sum, item) => {
      return sum + (item.get('lineTotal')?.value || 0);
    }, 0);
  }

  getAvailableProducts(currentIndex: number): Product[] {
    const selectedIds = this.items.controls
      .map((item, index) => index !== currentIndex ? item.get('productId')?.value : null)
      .filter(id => id);

    return this.products.filter(p => !selectedIds.includes(p.ProductId));
  }

  // ADD THESE NEW METHODS FOR CUSTOMER MANAGEMENT
  openCustomerModal(): void {
    this.showCustomerModal = true;
    this.customerForm.reset();
  }

  closeCustomerModal(): void {
    this.showCustomerModal = false;
    this.customerForm.reset();
  }

  addCustomer(): void {
    if (this.customerForm.invalid) {
      this.markFormGroupTouched(this.customerForm);
      return;
    }

    this.addingCustomer = true;
    const customerData = this.customerForm.value;

    this.customerService.createCustomer(customerData).subscribe({
      next: (response) => {
        this.toastr.success('Customer added successfully', 'Success');
        this.closeCustomerModal();
        // Reload customers and auto-select the new one
        this.loadCustomers();
        setTimeout(() => {
          if (response.data?.customerId) {
            this.salesForm.patchValue({ customerId: response.data.customerId });
          }
        }, 500);
      },
      error: (error) => {
        this.addingCustomer = false;
        const errorMessage = error.error?.message || 'Failed to add customer';
        this.toastr.error(errorMessage, 'Error');
      },
      complete: () => {
        this.addingCustomer = false;
      }
    });
  }

  onSubmit(): void {
    if (this.salesForm.invalid || this.items.length === 0) {
      this.markFormGroupTouched(this.salesForm);
      this.toastr.error('Please fill all required fields', 'Validation Error');
      return;
    }

    this.submitting = true;

    const formValue = this.salesForm.getRawValue();
    const saleData = {
      customerId: formValue.customerId,
      paymentType: formValue.paymentType,
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate
      }))
    };

    this.salesService.createSale(saleData).subscribe({
      next: (response) => {
        this.toastr.success(`Sale completed! Total: ₹${response.data.totalAmount}`, 'Success');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.submitting = false;
        const errorMessage = error.error?.message || 'Failed to create sale';
        this.toastr.error(errorMessage, 'Error');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // GETTERS FOR CUSTOMER FORM
  get customerName() { return this.customerForm.get('customerName'); }
  get mobile() { return this.customerForm.get('mobile'); }
  get email() { return this.customerForm.get('email'); }
}
