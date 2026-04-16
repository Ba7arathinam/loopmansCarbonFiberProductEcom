import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
  
  // Dynamic Pricing State
  selectedOptions: Record<string, string> = {};
  currentPrice = 0;
  
  // Bulk Enquiry Modal
  showBulkEnquiry = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params['id']);
      this.product = this.productService.getById(id);
      if (this.product) {
        this.related = this.productService.getRelated(this.product, 4);
        this.selectedImage = 0;
        this.quantity = 1;
        this.addedAnimation = false;
        
        // Initialize default options
        this.selectedOptions = {};
        if (this.product.options) {
          this.product.options.forEach(opt => {
            if (opt.values && opt.values.length > 0) {
              this.selectedOptions[opt.name] = opt.values[0];
            }
          });
        }
        this.updatePrice();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  selectOption(optionName: string, value: string): void {
    this.selectedOptions[optionName] = value;
    this.updatePrice();
  }

  updatePrice(): void {
    if (!this.product) return;
    
    // Base price fallback
    this.currentPrice = this.product.basePrice;

    // Matrix lookup if available
    if (this.product.priceMatrix && Object.keys(this.selectedOptions).length > 0) {
      // Sort keys to ensure predictable lookup order matching the matrix
      const matrixKeys = Object.keys(this.selectedOptions)
        .sort()
        .map(k => `${k}:${this.selectedOptions[k]}`)
        .join('|');
      
      if (this.product.priceMatrix[matrixKeys]) {
        this.currentPrice = this.product.priceMatrix[matrixKeys];
      }
    }
  }

  selectImage(i: number): void { this.selectedImage = i; }

  incQty(): void { if (this.quantity < (this.product?.stockCount ?? 1)) this.quantity++; }
  decQty(): void { if (this.quantity > 1) this.quantity--; }

  addToCart(): void {
    if (!this.product?.inStock) return;
    // We add the item dynamically, passing the selected options and the correctly calculated price.
    // The cart service handles quantity aggregation.
    this.cartService.addItem(this.product, this.quantity, this.selectedOptions, this.currentPrice);
    
    // Reset local quantity count
    this.quantity = 1;
    this.addedAnimation = true;
    setTimeout(() => this.addedAnimation = false, 2000);
  }

  openBulkEnquiry(): void {
    this.showBulkEnquiry = true;
  }
  closeBulkEnquiry(): void {
    this.showBulkEnquiry = false;
  }

  getStars(n: number): boolean[] { return Array(5).fill(false).map((_, i) => i < Math.floor(n)); }

  getDiscount(): number {
    if (!this.product?.originalPrice) return 0;
    return Math.round((1 - this.currentPrice / this.product.originalPrice) * 100);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
