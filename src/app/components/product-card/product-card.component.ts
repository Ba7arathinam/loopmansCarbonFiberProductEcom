import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyInrPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input() product!: Product;
  addedAnimation = false;

  constructor(private cartService: CartService) {}

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.product.inStock) return;
    
    // Pick default options if any
    const defaultOptions: Record<string, string> = {};
    if (this.product.options) {
      this.product.options.forEach(opt => {
        if (opt.values.length > 0) defaultOptions[opt.name] = opt.values[0];
      });
    }

    this.cartService.addItem(this.product, 1, defaultOptions, this.product.basePrice);
    
    this.addedAnimation = true;
    setTimeout(() => this.addedAnimation = false, 1600);
  }

  getStarsFilled(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  getBadgeClass(badge?: string): string {
    return badge ? `badge badge--${badge.toLowerCase()}` : '';
  }
}
