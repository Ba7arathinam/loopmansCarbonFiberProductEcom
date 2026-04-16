import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CartItem } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, CartItemComponent, CurrencyInrPipe],
  templateUrl: './cart-sidebar.component.html',
  styleUrl: './cart-sidebar.component.scss',
})
export class CartSidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  items: CartItem[] = [];
  total = 0;
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.items$.pipe(takeUntil(this.destroy$)).subscribe(i => this.items = i);
    this.cartService.total$.pipe(takeUntil(this.destroy$)).subscribe(t => this.total = t);
  }

  close(): void    { this.cartService.closeCart(); }
  checkout(): void { this.cartService.openCheckout(); }

  getItemTrackKey(item: CartItem): string {
    const opts = item.selectedOptions
      ? Object.keys(item.selectedOptions).sort().map(k => `${k}:${item.selectedOptions![k]}`).join('|')
      : '';
    return `${item.product.id}_${opts}`;
  }

  get shipping(): number   { return this.total >= 50000 ? 0 : 1500; }
  get grandTotal(): number { return this.total + this.shipping; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
