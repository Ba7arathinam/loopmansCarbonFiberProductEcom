import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CartSidebarComponent } from './components/cart-sidebar/cart-sidebar.component';
import { CheckoutDialogComponent } from './components/checkout-dialog/checkout-dialog.component';
import { OrderSuccessDialogComponent } from './components/order-success-dialog/order-success-dialog.component';
import { CartService } from './services/cart.service';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    NavbarComponent,
    FooterComponent,
    CartSidebarComponent,
    CheckoutDialogComponent,
    OrderSuccessDialogComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  cartOpen = false;
  checkoutOpen = false;
  orderSuccessOpen = false;
  lastOrderId = '';

  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => this.cartOpen = v);
    this.cartService.checkoutOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => this.checkoutOpen = v);
    this.cartService.orderSuccessOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => this.orderSuccessOpen = v);
    this.cartService.lastOrderId$.pipe(takeUntil(this.destroy$)).subscribe(v => this.lastOrderId = v);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
