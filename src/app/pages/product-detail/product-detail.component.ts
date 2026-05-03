import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { BulkEnquiryDialogComponent } from '../../components/bulk-enquiry-dialog/bulk-enquiry-dialog.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, CurrencyInrPipe, BulkEnquiryDialogComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | undefined;
  related: Product[] = [];
  selectedImage = 0;
  quantity = 1;
  addedAnimation = false;
  activeTab: 'description' | 'specs' = 'description';
  loading = true;

  // Dynamic Pricing State
  selectedOptions: Record<string, string> = {};
  currentPrice = 0;

  /**
   * Images that appear when a matching measurement variant is selected.
   * These are shown AFTER default images and cleared when selection changes away.
   */
  activeVariantImages: string[] = [];
  fallbackToDefaultImage = true;

  // Bulk Enquiry Modal
  showBulkEnquiry = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'] as string;
        this.loading = true;
        this.product = undefined;
        return this.productService.getById(id);
      }),
      takeUntil(this.destroy$)
    ).subscribe(product => {
      this.loading = false;
      this.product = product;
      if (product) {
        this.initProduct(product);
      }
    });
  }

  private initProduct(product: Product): void {
    this.productService.getRelated(product, 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => this.related = r);

    this.selectedImage = 0;
    this.quantity = 1;
    this.addedAnimation = false;
    this.activeVariantImages = [];
    this.fallbackToDefaultImage = true;

    // Pre-select first value of each option
    this.selectedOptions = {};
    if (product.options) {
      product.options.forEach(opt => {
        if (opt.values?.length > 0) {
          this.selectedOptions[opt.name] = opt.values[0];
        }
      });
    }
    this.resolveSelection();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectOption(optionName: string, value: string): void {
    this.selectedOptions[optionName] = value;
    this.resolveSelection();
  }

  resolveSelection(): void {
    if (!this.product) return;
    this.productService.resolveVariant(this.product.id, this.selectedOptions)
      .pipe(takeUntil(this.destroy$))
      .subscribe((resolution) => {
        this.currentPrice = resolution.price;
        this.activeVariantImages = resolution.fallbackToDefault ? [] : resolution.images;
        this.fallbackToDefaultImage = resolution.fallbackToDefault;
        this.selectedImage = 0;
      });
  }

  /** Gallery: active variant images IF available, otherwise default images */
  get galleryImages(): string[] {
    if (!this.product) return [];
    if (!this.fallbackToDefaultImage && this.activeVariantImages.length > 0) {
      return this.activeVariantImages;
    }
    return this.product.images ?? [];
  }

  selectImage(i: number): void { this.selectedImage = i; }

  incQty(): void { if (this.quantity < (this.product?.stockCount ?? 1)) this.quantity++; }
  decQty(): void { if (this.quantity > 1) this.quantity--; }

  addToCart(): void {
    if (!this.product?.inStock) return;
    this.cartService.addItem(this.product, this.quantity, this.selectedOptions, this.currentPrice);
    this.quantity = 1;
    this.addedAnimation = true;
    setTimeout(() => this.addedAnimation = false, 2000);
  }

  openBulkEnquiry(): void { this.showBulkEnquiry = true; }
  closeBulkEnquiry(): void { this.showBulkEnquiry = false; }

  getStars(n: number): boolean[] { return Array(5).fill(false).map((_, i) => i < Math.floor(n)); }

  getDiscount(): number {
    if (!this.product?.originalPrice) return 0;
    return Math.round((1 - this.currentPrice / this.product.originalPrice) * 100);
  }

  isVariantImage(idx: number): boolean {
    void idx;
    return !this.fallbackToDefaultImage;
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
