import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CartItem, Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  private cartOpenSubject = new BehaviorSubject<boolean>(false);
  private checkoutOpenSubject = new BehaviorSubject<boolean>(false);
  private orderSuccessOpenSubject = new BehaviorSubject<boolean>(false);
  private lastOrderIdSubject = new BehaviorSubject<string>('');

  items$ = this.itemsSubject.asObservable();
  cartOpen$ = this.cartOpenSubject.asObservable();
  checkoutOpen$ = this.checkoutOpenSubject.asObservable();
  orderSuccessOpen$ = this.orderSuccessOpenSubject.asObservable();
  lastOrderId$ = this.lastOrderIdSubject.asObservable();

  count$: Observable<number> = this.items$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  total$: Observable<number> = this.items$.pipe(
    map(items => items.reduce((sum, item) => sum + item.calculatedPrice * item.quantity, 0))
  );

  // Helper to generate a unique key for a product + options combination
  private getItemKey(productId: number, options?: Record<string, string>): string {
    if (!options) return productId.toString();
    const sortedKeys = Object.keys(options).sort();
    const optionsStr = sortedKeys.map(k => `${k}:${options[k]}`).join('|');
    return `${productId}_${optionsStr}`;
  }

  addItem(product: Product, quantity: number = 1, selectedOptions?: Record<string, string>, price?: number): void {
    const items = this.itemsSubject.value;
    const finalPrice = price !== undefined ? price : product.basePrice;
    
    const targetKey = this.getItemKey(product.id, selectedOptions);
    
    const existingIndex = items.findIndex(item => 
      this.getItemKey(item.product.id, item.selectedOptions) === targetKey
    );

    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity
      };
      this.itemsSubject.next(newItems);
    } else {
      // Shallow copy selectedOptions so it doesn't mutate unexpectedly
      const optionsCopy = selectedOptions ? { ...selectedOptions } : undefined;
      this.itemsSubject.next([...items, { product, quantity, selectedOptions: optionsCopy, calculatedPrice: finalPrice }]);
    }
    
    this.openCart();
  }

  removeItem(product: Product, selectedOptions?: Record<string, string>): void {
    const targetKey = this.getItemKey(product.id, selectedOptions);
    const items = this.itemsSubject.value.filter(i => 
      this.getItemKey(i.product.id, i.selectedOptions) !== targetKey
    );
    this.itemsSubject.next(items);
  }

  updateQty(product: Product, selectedOptions: Record<string, string> | undefined, qty: number): void {
    if (qty <= 0) { this.removeItem(product, selectedOptions); return; }
    
    const targetKey = this.getItemKey(product.id, selectedOptions);
    const items = this.itemsSubject.value.map(i =>
      this.getItemKey(i.product.id, i.selectedOptions) === targetKey 
        ? { ...i, quantity: qty } 
        : i
    );
    this.itemsSubject.next(items);
  }

  clearCart(): void { this.itemsSubject.next([]); }

  getTotal(): number {
    return this.itemsSubject.value.reduce((s, i) => s + i.calculatedPrice * i.quantity, 0);
  }

  getCount(): number {
    return this.itemsSubject.value.reduce((s, i) => s + i.quantity, 0);
  }

  openCart(): void { this.cartOpenSubject.next(true); }
  closeCart(): void { this.cartOpenSubject.next(false); }
  toggleCart(): void { this.cartOpenSubject.next(!this.cartOpenSubject.value); }

  openCheckout(): void { this.closeCart(); this.checkoutOpenSubject.next(true); }
  closeCheckout(): void { this.checkoutOpenSubject.next(false); }

  openOrderSuccess(orderId: string): void {
    this.lastOrderIdSubject.next(orderId);
    this.closeCheckout();
    this.orderSuccessOpenSubject.next(true);
  }
  closeOrderSuccess(): void { this.orderSuccessOpenSubject.next(false); }
}
