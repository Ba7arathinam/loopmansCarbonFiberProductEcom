import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

// ── Verified Unsplash automotive photo IDs ─────────────────────────────────
const I = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=82`;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly products: Product[] = [
    {
      id: 1, name: 'High Quality 3K Twill Roll Wrapped Carbon Fibre Hollow Round Tube - Gloss', slug: 'carbon-fibre-hollow-round-tube-gloss',
      category: 'Accessories', basePrice: 1199.99,
      rating: 4.8, reviewCount: 142, inStock: true, stockCount: 50,
      description: 'Our Carbon Fiber tubes are designed for the best strength to weight ratio. We use a full wrap of 3K filament fabric impregnated with strong clear epoxy resulting in an excellent stiff and strong tube with a beautiful glossy finish.',
      features: ['3K Twill weave carbon fiber', 'Roll wrapped construction', 'High gloss clear coat finish', 'Superior straightness and stiffness', 'Ideal for drones, RC, and structural applications'],
      specs: [{ label: 'Material', value: 'Carbon Fiber' }, { label: 'Construction', value: 'Roll Wrapped' }, { label: 'Finish', value: 'Gloss' }],
      images: [I('1609521263047-f8f205293f24')],
      isFeatured: true,
      options: [
        { name: 'OD', values: ['6MM', '8MM', '10MM', '12MM', '16MM', '18MM', '20MM', '24MM', '25MM', '28MM', '30MM', '38MM', '40MM', '45MM', '50MM'] },
        { name: 'Thickness (mm)', values: ['1.0 MM', '1.5 MM', '2.0 MM', '4.5 MM'] },
        { name: 'Length', values: ['500MM', '1000MM'] },
        { name: 'Surface Finish', values: ['MATTE', 'GLOSS'] }
      ]
    },
    {
      id: 2, name: 'High Quality 3K Twill Roll Wrapped Carbon Fibre Plate / Sheet', slug: 'carbon-fibre-plate-sheet',
      category: 'Body Kits', basePrice: 5094.00,
      rating: 4.9, reviewCount: 87, inStock: true, stockCount: 100,
      description: 'Premium quality 3K carbon fibre sheets manufactured from 100% carbon fibre using a high pressure roll wrapped compression process. Perfect for making custom brackets, chassis parts, and mounting plates.',
      features: ['100% pure carbon fibre', 'Twill weave surface layer', 'High-compression manufactured', 'Excellent machinability', 'Both sides have premium finish'],
      specs: [{ label: 'Material', value: 'Carbon Fiber Plate' }, { label: 'Tolerance', value: '0.3 / 0.1 (+-)' }, { label: 'Compliances', value: 'COC with material COA' }],
      images: [I('1492144534655-ae79c964c9d7')],
      isFeatured: true,
      badge: 'Hot',
      options: [
        { name: 'Size', values: [
          '300MM X 300MM', '400MM X 300MM', '500MM X 300MM', '600MM X 300MM', '700MM X 300MM', '800MM X 300MM', '900MM X 300MM', '1000MM X 300MM',
          '300MM X 400MM', '400MM X 400MM', '500MM X 400MM', '600MM X 400MM', '700MM X 400MM', '800MM X 400MM', '900MM X 400MM', '1000MM X 400MM'
        ] },
        { name: 'Thickness', values: ['2.0MM', '3.0MM', '4.0MM', '5.0MM'] },
          { name: 'Surface Finish', values: ['MATTE', 'GLOSS'] }
      ],
      priceMatrix: {
        // 2mm Thickness
        'Size:300MM X 300MM|Thickness:2.0MM': 5094, 'Size:400MM X 300MM|Thickness:2.0MM': 5251, 'Size:500MM X 300MM|Thickness:2.0MM': 5414, 'Size:600MM X 300MM|Thickness:2.0MM': 5581, 'Size:700MM X 300MM|Thickness:2.0MM': 5754, 'Size:800MM X 300MM|Thickness:2.0MM': 5932, 'Size:900MM X 300MM|Thickness:2.0MM': 6115, 'Size:1000MM X 300MM|Thickness:2.0MM': 6304,
        'Size:300MM X 400MM|Thickness:2.0MM': 6367, 'Size:400MM X 400MM|Thickness:2.0MM': 6564, 'Size:500MM X 400MM|Thickness:2.0MM': 6767, 'Size:600MM X 400MM|Thickness:2.0MM': 6977, 'Size:700MM X 400MM|Thickness:2.0MM': 7192, 'Size:800MM X 400MM|Thickness:2.0MM': 7415, 'Size:900MM X 400MM|Thickness:2.0MM': 7644, 'Size:1000MM X 400MM|Thickness:2.0MM': 7881,
        // 3mm Thickness
        'Size:300MM X 300MM|Thickness:3.0MM': 6499, 'Size:400MM X 300MM|Thickness:3.0MM': 6700, 'Size:500MM X 300MM|Thickness:3.0MM': 6908, 'Size:600MM X 300MM|Thickness:3.0MM': 7121, 'Size:700MM X 300MM|Thickness:3.0MM': 7342, 'Size:800MM X 300MM|Thickness:3.0MM': 7569, 'Size:900MM X 300MM|Thickness:3.0MM': 7803, 'Size:1000MM X 300MM|Thickness:3.0MM': 8044,
        'Size:300MM X 400MM|Thickness:3.0MM': 8124, 'Size:400MM X 400MM|Thickness:3.0MM': 8376, 'Size:500MM X 400MM|Thickness:3.0MM': 8635, 'Size:600MM X 400MM|Thickness:3.0MM': 8902, 'Size:700MM X 400MM|Thickness:3.0MM': 9177, 'Size:800MM X 400MM|Thickness:3.0MM': 9461, 'Size:900MM X 400MM|Thickness:3.0MM': 9753, 'Size:1000MM X 400MM|Thickness:3.0MM': 10055,
        // 4mm Thickness
        'Size:300MM X 300MM|Thickness:4.0MM': 8293, 'Size:400MM X 300MM|Thickness:4.0MM': 8549, 'Size:500MM X 300MM|Thickness:4.0MM': 8814, 'Size:600MM X 300MM|Thickness:4.0MM': 9086, 'Size:700MM X 300MM|Thickness:4.0MM': 9367, 'Size:800MM X 300MM|Thickness:4.0MM': 9657, 'Size:900MM X 300MM|Thickness:4.0MM': 9956, 'Size:1000MM X 300MM|Thickness:4.0MM': 10264,
        'Size:300MM X 400MM|Thickness:4.0MM': 10366, 'Size:400MM X 400MM|Thickness:4.0MM': 10687, 'Size:500MM X 400MM|Thickness:4.0MM': 11017, 'Size:600MM X 400MM|Thickness:4.0MM': 11358, 'Size:700MM X 400MM|Thickness:4.0MM': 11709, 'Size:800MM X 400MM|Thickness:4.0MM': 12071, 'Size:900MM X 400MM|Thickness:4.0MM': 12445, 'Size:1000MM X 400MM|Thickness:4.0MM': 12830,
        // 5mm Thickness
        'Size:300MM X 300MM|Thickness:5.0MM': 10581, 'Size:400MM X 300MM|Thickness:5.0MM': 10908, 'Size:500MM X 300MM|Thickness:5.0MM': 11246, 'Size:600MM X 300MM|Thickness:5.0MM': 11594, 'Size:700MM X 300MM|Thickness:5.0MM': 11952, 'Size:800MM X 300MM|Thickness:5.0MM': 12322, 'Size:900MM X 300MM|Thickness:5.0MM': 12703, 'Size:1000MM X 300MM|Thickness:5.0MM': 13096,
        'Size:300MM X 400MM|Thickness:5.0MM': 13226, 'Size:400MM X 400MM|Thickness:5.0MM': 13635, 'Size:500MM X 400MM|Thickness:5.0MM': 14057, 'Size:600MM X 400MM|Thickness:5.0MM': 14492, 'Size:700MM X 400MM|Thickness:5.0MM': 14940, 'Size:800MM X 400MM|Thickness:5.0MM': 15402, 'Size:900MM X 400MM|Thickness:5.0MM': 15879, 'Size:1000MM X 400MM|Thickness:5.0MM': 16370
      }
    },
    {
      id: 3, name: 'High Quality 3K Twill Roll Wrapped Carbon Fibre Square Tube', slug: 'carbon-fibre-square-tube',
      category: 'Accessories', basePrice: 12499.99,
      rating: 4.8, reviewCount: 56, inStock: true, stockCount: 75,
      description: 'Ultra-lightweight and strong square carbon fiber tubes. Built through roll-wrapping process yielding superior structural integrity compared to pultrusion profiles. Excellent for framing, reinforcement, or drone manufacturing.',
      features: ['Hollow square cross-section', 'Lightweight structural capacity', 'Available in Matte and Gloss finishes', 'High stiffness, low density', 'Resistant to corrosion'],
      specs: [{ label: 'Material', value: 'Carbon Fiber' }, { label: 'Style', value: 'Square Hollow Tube' }, { label: 'Length', value: '1000MM' }],
      images: [I('1503376780353-7e6692767b70')],
      isFeatured: true,
      options: [
        { name: 'Size', values: [
          '10MM X 8MM', '15MM X 12MM', '15MM X 13MM', '18MM X 14MM', '18MM X 16MM', 
          '20MM X 16MM', '20MM X 17MM', '20MM X 18MM', '25MM X 22MM', '25MM X 23MM', 
          '30MM X 25MM', '30MM X 26MM', '30MM X 27MM', '30MM X 28MM', '35MM X 31MM', 
          '40MM X 35MM', '40MM X 36MM', '40MM X 38MM', '50MM X 45MM'
        ] },
        { name: 'Surface Finish', values: ['MATTE', 'GLOSS'] },
        { name: 'Length', values: ['1000MM'] }
      ]
    }
  ];

  getAll(): Product[] { return this.products; }
  getById(id: number): Product | undefined { return this.products.find(p => p.id === id); }
  getBySlug(slug: string): Product | undefined { return this.products.find(p => p.slug === slug); }
  getCategories(): string[] { return ['All', 'Body Kits', 'Spoilers', 'Hoods', 'Interior', 'Accessories']; }
  getFeatured(): Product[] { return this.products.filter(p => p.isFeatured); }
  getByCategory(category: string): Product[] { return category === 'All' ? this.products : this.products.filter(p => p.category === category); }
  getRelated(product: Product, limit = 4): Product[] { return this.products.filter(p => p.category === product.category && p.id !== product.id).slice(0, limit); }
}
