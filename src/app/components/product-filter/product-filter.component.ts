import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-filter.component.html',
  styleUrl: './product-filter.component.scss',
})
export class ProductFilterComponent implements OnInit {
  @Input() selectedCategory = 'All';
  @Input() selectedSort = 'newest';
  @Output() categoryChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();

  categories: string[] = [];
  sortOptions = [
    { value: 'newest',     label: 'Newest First' },
    { value: 'price-asc',  label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'rating',     label: 'Top Rated' },
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void { this.categories = this.productService.getCategories(); }

  selectCategory(cat: string): void { this.categoryChange.emit(cat); }

  onSortChange(event: Event): void {
    this.sortChange.emit((event.target as HTMLSelectElement).value);
  }
}
