import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss',
})
export class CartItemComponent {
  @Input() item!: CartItem;
  constructor(private cartService: CartService) {}

  increase(): void { this.cartService.updateQty(this.item.product, this.item.selectedOptions, this.item.quantity + 1); }
  decrease(): void { this.cartService.updateQty(this.item.product, this.item.selectedOptions, this.item.quantity - 1); }
  remove(): void   { this.cartService.removeItem(this.item.product, this.item.selectedOptions); }

  get lineTotal(): number { return this.item.calculatedPrice * this.item.quantity; }

  getOptionsString(): string {
    if (!this.item.selectedOptions || Object.keys(this.item.selectedOptions).length === 0) return '';
    return Object.entries(this.item.selectedOptions).map(([k, v]) => `${v}`).join(' • ');
  }
}
