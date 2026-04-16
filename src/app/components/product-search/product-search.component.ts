import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss',
})
export class ProductSearchComponent {
  @Output() searchChange = new EventEmitter<string>();
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(280), distinctUntilChanged())
      .subscribe(term => this.searchChange.emit(term));
  }

  onInput(): void { this.searchSubject.next(this.searchTerm); }
  clear(): void { this.searchTerm = ''; this.searchSubject.next(''); }
}
