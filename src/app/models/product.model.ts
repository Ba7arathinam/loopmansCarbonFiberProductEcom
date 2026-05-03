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
  /** Firestore document ID (string). Previously was a number. */
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  basePrice: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  description: string;
  features: string[];
  specs: ProductSpec[];
  /** Default images — always shown on the product detail page. URLs from Firebase Storage. */
  images: string[];
  badge?: ProductBadge;
  isFeatured?: boolean;

  // Dynamic Options & Matrix Pricing
  options?: ProductOption[];
  /**
   * Price matrix keyed by sorted option combos, e.g.:
   *   "OD:6MM|Surface Finish:MATTE|Thickness (mm):1.0 MM" → 280
   * Stored directly in Firestore document.
   */
  priceMatrix?: Record<string, number>;

  /**
   * Measurement-based images.
   * Key = a single option key fragment, e.g. "OD:6MM" or "Size:300MM X 300MM"
   * Value = array of image URLs to display when that option is actively selected
   *         AND it causes a price change.
   * Default images always remain visible; these are shown additionally.
   */
  variantImages?: Record<string, string[]>;

  createdAt?: any;
  updatedAt?: any;
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
