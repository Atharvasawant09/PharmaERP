import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductListComponent } from './components/products/product-list/product-list.component';
import { ProductFormComponent } from './components/products/product-form/product-form.component';
import { SalesEntryComponent } from './components/sales/sales-entry/sales-entry.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { PrescriptionUploadComponent } from './components/prescription/prescription-upload/prescription-upload.component';
import { SalesHistoryComponent } from './components/sales/sales-history/sales-history.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products',
    component: ProductListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products/add',
    component: ProductFormComponent,
    canActivate: [authGuard, roleGuard(['Admin', 'Manager'])]
  },
  {
    path: 'products/edit/:id',
    component: ProductFormComponent,
    canActivate: [authGuard, roleGuard(['Admin', 'Manager'])]
  },
  {
    path: 'sales',
    component: SalesEntryComponent,
    canActivate: [authGuard]
  },
  {
    path: 'prescription',  // ADD THIS
    component: PrescriptionUploadComponent,
    canActivate: [authGuard]
  },
   {
    path: 'sales/history',  // ADD THIS
    component: SalesHistoryComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];
