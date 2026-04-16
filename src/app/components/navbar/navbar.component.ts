import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartCount = 0;
  isScrolled = false;
  mobileMenuOpen = false;
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.count$.pipe(takeUntil(this.destroy$)).subscribe(c => this.cartCount = c);
  }

  @HostListener('window:scroll')
  onScroll(): void { this.isScrolled = window.scrollY > 50; }

  openCart(): void { this.cartService.openCart(); this.mobileMenuOpen = false; }
  toggleMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.mobileMenuOpen = false;
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
