import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CartSidebarComponent } from './components/cart-sidebar/cart-sidebar.component';
import { CheckoutDialogComponent } from './components/checkout-dialog/checkout-dialog.component';
import { OrderSuccessDialogComponent } from './components/order-success-dialog/order-success-dialog.component';
import { CartService } from './services/cart.service';
import { ProductSeederService } from './services/product-seeder.service';
import { environment } from '../environments/environment';

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
  now = Date.now();
  isLive = false;
  isCelebrating = false;

  readonly launchAt = new Date('2026-05-04T00:00:00+05:30').getTime();
  readonly confetti = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    left: `${6 + ((index * 31) % 88)}%`,
    delay: `${(index % 10) * 0.08}s`,
    duration: `${1.8 + (index % 5) * 0.2}s`,
    color: ['#ef4444', '#3b82f6', '#f8fafc', '#22c55e', '#f59e0b'][index % 5],
  }));

  private destroy$ = new Subject<void>();
  private countdownId?: ReturnType<typeof setInterval>;

  constructor(private cartService: CartService, public router: Router,private seeder:ProductSeederService) {}

  get isAdminRoute(): boolean { return this.router.url.startsWith('/admin'); }
  get remainingMs(): number { return Math.max(this.launchAt - this.now, 0); }
  get countdownParts() {
    const totalSeconds = Math.floor(this.remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      { label: 'Days', value: days },
      { label: 'Hours', value: hours },
      { label: 'Minutes', value: minutes },
      { label: 'Seconds', value: seconds },
    ];
  }

  async ngOnInit() {
    this.cartService.cartOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => this.cartOpen = v);
    this.cartService.checkoutOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => this.checkoutOpen = v);
    this.cartService.orderSuccessOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => this.orderSuccessOpen = v);
    this.cartService.lastOrderId$.pipe(takeUntil(this.destroy$)).subscribe(v => this.lastOrderId = v);
    if (environment.autoSeedOnStartup) {
      try {
        await this.seeder.seedInitialProducts();
      } catch (err) {
        console.warn('Auto seeding skipped:', err);
      }
    }
    this.startLaunchCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownId) clearInterval(this.countdownId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startLaunchCountdown(): void {
    if (this.remainingMs === 0) {
      this.isLive = true;
      return;
    }

    this.countdownId = setInterval(() => {
      this.now = Date.now();
      if (this.remainingMs > 0) return;

      if (this.countdownId) clearInterval(this.countdownId);
      this.isCelebrating = true;
      setTimeout(() => {
        this.isCelebrating = false;
        this.isLive = true;
      }, 3200);
    }, 1000);
  }
}
