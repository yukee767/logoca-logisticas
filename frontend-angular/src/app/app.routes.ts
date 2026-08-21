import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'catalogo', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
      { path: 'produto/:id', loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      { path: 'carrinho', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
      { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'para-empresas', loadComponent: () => import('./features/para-empresas/para-empresas.component').then(m => m.ParaEmpresasComponent) },
      { path: 'sobre', loadComponent: () => import('./features/sobre/sobre.component').then(m => m.SobreComponent) },
      { path: 'contato', loadComponent: () => import('./features/contato/contato.component').then(m => m.ContatoComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
