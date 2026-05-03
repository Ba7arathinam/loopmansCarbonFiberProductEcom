import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFilterComponent } from '../../components/product-filter/product-filter.component';
import { ProductSearchComponent } from '../../components/product-search/product-search.component';
import { FilterProductsPipe } from '../../pipes/filter-products.pipe';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, ProductFilterComponent, ProductSearchComponent, FilterProductsPipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = true;
  selectedCategory = 'All';
  searchTerm = '';
  selectedSort = 'newest';

  stats = [
    { value: '2,000+', label: 'Premium Parts' },
    { value: '50+',    label: 'Global Brands' },
    { value: '10K+',   label: 'Happy Customers' },
    { value: 'Free',   label: 'Shipping above ₹50K' },
  ];

  categories = [
    { name: 'Body Kits',   emoji: '🚗', desc: 'Full aero packages',      color: '#00e5ff', count: 4 },
    { name: 'Spoilers',    emoji: '🏁', desc: 'Rear wing systems',        color: '#ff9000', count: 4 },
    { name: 'Hoods',       emoji: '🔧', desc: 'Lightweight engine lids',  color: '#8b5cf6', count: 4 },
    { name: 'Interior',    emoji: '🏆', desc: 'Racing cabin upgrades',    color: '#10b981', count: 4 },
    { name: 'Accessories', emoji: '⚡', desc: 'Premium finish details',   color: '#ef4444', count: 4 },
  ];

  testimonials = [
    { name: 'Arjun Mehta', car: 'Honda Civic FK8', text: 'The Aero Pro body kit transformed my Civic completely. Fitment was spot-on, the carbon weave is absolutely stunning in person.', rating: 5, avatar: 'AM' },
    { name: 'Priya Singh', car: 'Hyundai i20 N Line', text: 'LOOPMANS swan neck GT wing is a masterpiece. Instructions were crystal clear, the whole install took under 2 hours. Worth every rupee.', rating: 5, avatar: 'PS' },
    { name: 'Karthik Rajan', car: 'Suzuki Baleno RS', text: 'Quick delivery, premium packaging, and the mirror caps look absolutely factory-level. Will definitely be ordering the hood kit next.', rating: 5, avatar: 'KR' },
  ];

  features = [
    { icon: '♦', title: 'Authentic Carbon Fiber', desc: 'Every product uses genuine 2×2 twill or dry carbon weave — never cheap imitations.' },
    { icon: '⚡', title: 'Race-Tested Performance', desc: 'Wind tunnel developed profiles that actually improve aerodynamics, not just aesthetics.' },
    { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fast, insured shipping to all Indian cities. Free for orders above ₹50,000.' },
  ];

  private destroy$ = new Subject<void>();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.products$.pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.products = p;
      this.loading = false;
    });
    this.productService.refresh();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onCategoryChange(cat: string): void { this.selectedCategory = cat; }
  onSearchChange(term: string): void  { this.searchTerm = term; }
  onSortChange(sort: string): void    { this.selectedSort = sort; }

  scrollToShop(): void { document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }
  filterBy(cat: string): void { this.selectedCategory = cat; setTimeout(() => this.scrollToShop(), 100); }

  getStars(n: number): boolean[] { return Array(5).fill(false).map((_, i) => i < n); }
}

