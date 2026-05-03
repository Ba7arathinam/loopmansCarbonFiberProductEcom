import { Injectable, inject } from '@angular/core';
import { ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class ProductSeederService {
  private productService = inject(ProductService);

  async seedInitialProducts(): Promise<number> {
    const seededCount = await this.productService.seedDefaults();
    await this.productService.refresh();
    return seededCount;
  }
}