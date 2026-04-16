import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  links = [
    { label: 'Body Kits',    href: '#shop' },
    { label: 'Spoilers',     href: '#shop' },
    { label: 'Hoods',        href: '#shop' },
    { label: 'Interior',     href: '#shop' },
    { label: 'Accessories',  href: '#shop' },
  ];

  scrollTo(id: string, e: Event): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
