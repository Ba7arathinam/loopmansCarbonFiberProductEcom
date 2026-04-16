import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order-success-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success-dialog.component.html',
  styleUrl: './order-success-dialog.component.scss',
})
export class OrderSuccessDialogComponent {
  @Input() orderId = '';
  constructor(private cartService: CartService) {}
  continueShopping(): void { this.cartService.closeOrderSuccess(); }
}
