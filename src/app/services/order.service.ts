import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { CartItem, CustomerInfo, Order } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private firestore = inject(Firestore);
  private readonly col = collection(this.firestore, 'orders');

  async placeOrder(items: CartItem[], customer: CustomerInfo): Promise<Order> {
    const subtotal = items.reduce((s, i) => s + i.calculatedPrice * i.quantity, 0);
    const shipping = subtotal >= 50000 ? 0 : 1500;
    
    // Create a deterministic order ID for the user's reference
    const orderId = 'FB-' + Date.now().toString(36).toUpperCase();
    
    const orderPayload = {
      orderId, // Store the reference ID explicitly
      items: [...items],
      customer,
      subtotal,
      shipping,
      total: subtotal + shipping,
      status: 'confirmed',
      createdAt: serverTimestamp()
    };

    // Save to Firestore
    const docRef = await addDoc(this.col, orderPayload);

    // Return the Order object matching the model interface
    return {
      id: docRef.id,
      items: orderPayload.items,
      customer: orderPayload.customer,
      subtotal: orderPayload.subtotal,
      shipping: orderPayload.shipping,
      total: orderPayload.total,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };
  }

  async getOrders(): Promise<Order[]> {
    try {
      const q = query(this.col, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (err) {
      console.error('Failed to fetch orders', err);
      return [];
    }
  }
}
