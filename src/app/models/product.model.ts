export type Category = 'All' | 'Body Kits' | 'Spoilers' | 'Hoods' | 'Interior' | 'Accessories';
export type ProductCategory = Exclude<Category, 'All'>;
export type ProductBadge = 'New' | 'Sale' | 'Hot' | 'Featured';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: ProductCategory;
  basePrice: number;    // changed from price
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  description: string;
  features: string[];
  specs: ProductSpec[];
  images: string[];
  badge?: ProductBadge;
  isFeatured?: boolean;
  
  // Dynamic Options & Matrix Pricing
  options?: ProductOption[];
  priceMatrix?: Record<string, number>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  calculatedPrice: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerInfo;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
}
