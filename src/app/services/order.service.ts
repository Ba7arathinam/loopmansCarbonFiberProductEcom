import { Injectable } from '@angular/core';
import { CartItem, CustomerInfo, Order } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly STORAGE_KEY = 'loopmans_orders';

  placeOrder(items: CartItem[], customer: CustomerInfo): Order {
    const subtotal = items.reduce((s, i) => s + i.calculatedPrice * i.quantity, 0);
    const shipping = subtotal >= 50000 ? 0 : 1500;
    const order: Order = {
      id: 'LPM-' + Date.now().toString(36).toUpperCase(),
      items: [...items],
      customer,
      subtotal,
      shipping,
      total: subtotal + shipping,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };
    this.saveOrder(order);
    return order;
  }

  getOrders(): Order[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
  }
}
