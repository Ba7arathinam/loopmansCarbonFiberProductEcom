import { Pipe, PipeTransform } from '@angular/core';
import { Product } from '../models/product.model';

@Pipe({ name: 'filterProducts', standalone: true, pure: false })
export class FilterProductsPipe implements PipeTransform {
  transform(products: Product[], category: string, searchTerm: string, sortBy?: string): Product[] {
    let filtered = [...products];

    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case 'price-asc':   filtered.sort((a, b) => a.basePrice - b.basePrice); break;
      case 'price-desc':  filtered.sort((a, b) => b.basePrice - a.basePrice); break;
      case 'rating':      filtered.sort((a, b) => b.rating - a.rating); break;
      case 'newest':      // Backend query already sorts by newest
                          break;
    }

    return filtered;
  }
}
