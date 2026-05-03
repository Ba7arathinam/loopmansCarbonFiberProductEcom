import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CartItem } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'app-checkout-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyInrPipe],
  templateUrl: './checkout-dialog.component.html',
  styleUrl: './checkout-dialog.component.scss',
})
export class CheckoutDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  items: CartItem[] = [];
  total = 0;
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  indianStates = ['Andhra Pradesh','Assam','Bihar','Delhi','Goa','Gujarat','Haryana',
    'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
    'Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand',
    'West Bengal'];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [Validators.required, Validators.email]],
      phone:   ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city:    ['', Validators.required],
      state:   ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
    this.cartService.items$.pipe(takeUntil(this.destroy$)).subscribe(i => this.items = i);
    this.cartService.total$.pipe(takeUntil(this.destroy$)).subscribe(t => this.total = t);
  }

  close(): void { this.cartService.closeCheckout(); }

  get shipping(): number   { return this.total >= 50000 ? 0 : 1500; }
  get grandTotal(): number { return this.total + this.shipping; }

  err(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.touched && c.hasError(error));
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.items.length) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;
    try {
      const order = await this.orderService.placeOrder(this.items, this.form.value);
      this.cartService.clearCart();
      this.cartService.openOrderSuccess(order.id);
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      this.isSubmitting = false;
    }
  }

  getOptionsString(item: CartItem): string {
    if (!item.selectedOptions || Object.keys(item.selectedOptions).length === 0) return '';
    return Object.values(item.selectedOptions).join(' • ');
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
