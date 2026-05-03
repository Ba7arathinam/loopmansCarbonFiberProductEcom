import express, { Request, Response } from 'express';
import multer from 'multer';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage().bucket();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: '10mb' }));

type ProductCategory = 'Body Kits' | 'Spoilers' | 'Hoods' | 'Interior' | 'Accessories';
type ProductBadge = 'New' | 'Sale' | 'Hot' | 'Featured';

interface ProductOption {
  name: string;
  values: string[];
}

interface ProductSpec {
  label: string;
  value: string;
}

interface ProductAggregate {
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
  options?: ProductOption[];
  badge?: ProductBadge;
  isFeatured?: boolean;
  images: string[];
  variantImages: Record<string, string[]>;
  priceMatrix: Record<string, number>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const PRODUCTS = 'products';
const PRODUCT_IMAGES = 'product_images';
const PRODUCT_PRICE_MATRIX = 'product_price_matrix';

const buildMatrixKey = (selected: Record<string, string>): string => {
  return Object.keys(selected)
    .sort()
    .map((k) => `${k}:${selected[k]}`)
    .join('|');
};

const resolvePrice = (matrix: Record<string, number>, selected: Record<string, string>, basePrice: number): number => {
  const pairs = Object.keys(selected)
    .sort()
    .map((k) => `${k}:${selected[k]}`);

  for (let len = pairs.length; len >= 1; len--) {
    const key = pairs.slice(0, len).join('|');
    if (matrix[key] !== undefined) {
      return matrix[key];
    }
  }
  return basePrice;
};

const mapImageDocs = (
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[]
): { images: string[]; variantImages: Record<string, string[]> } => {
  const defaults: string[] = [];
  const variants: Record<string, string[]> = {};

  for (const doc of docs) {
    const data = doc.data();
    const url = data['url'] as string;
    const variantKey = (data['variantKey'] as string | null | undefined) ?? null;
    const sortOrder = (data['sortOrder'] as number | undefined) ?? 0;
    if (!url) continue;

    if (!variantKey) {
      defaults.push(`${sortOrder}::${url}`);
      continue;
    }

    if (!variants[variantKey]) variants[variantKey] = [];
    variants[variantKey].push(`${sortOrder}::${url}`);
  }

  const stripSort = (v: string) => v.split('::').slice(1).join('::');
  const sortByPrefix = (a: string, b: string) => {
    const aOrd = Number(a.split('::')[0] ?? 0);
    const bOrd = Number(b.split('::')[0] ?? 0);
    return aOrd - bOrd;
  };

  const normalizedVariants: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(variants)) {
    normalizedVariants[key] = [...list].sort(sortByPrefix).map(stripSort);
  }

  return {
    images: defaults.sort(sortByPrefix).map(stripSort),
    variantImages: normalizedVariants,
  };
};

const toNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const paramValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

const hydrateProduct = async (id: string): Promise<ProductAggregate | null> => {
  const productSnap = await db.collection(PRODUCTS).doc(id).get();
  if (!productSnap.exists) return null;

  const [imagesSnap, matrixSnap] = await Promise.all([
    db.collection(PRODUCT_IMAGES).where('productId', '==', id).get(),
    db.collection(PRODUCT_PRICE_MATRIX).where('productId', '==', id).get(),
  ]);

  const imageMap = mapImageDocs(imagesSnap.docs);
  const matrix: Record<string, number> = {};
  for (const row of matrixSnap.docs) {
    const data = row.data();
    if (typeof data['key'] === 'string') {
      matrix[data['key']] = toNumber(data['price'], 0);
    }
  }

  return {
    id: productSnap.id,
    ...(productSnap.data() as Omit<ProductAggregate, 'id' | 'images' | 'variantImages' | 'priceMatrix'>),
    images: imageMap.images,
    variantImages: imageMap.variantImages,
    priceMatrix: matrix,
  };
};

const persistImages = async (productId: string, defaultImages: string[], variantImages: Record<string, string[]>): Promise<void> => {
  const existing = await db.collection(PRODUCT_IMAGES).where('productId', '==', productId).get();
  const batch = db.batch();
  existing.docs.forEach((d) => batch.delete(d.ref));

  defaultImages.forEach((url, index) => {
    const ref = db.collection(PRODUCT_IMAGES).doc();
    batch.set(ref, {
      productId,
      url,
      variantKey: null,
      sortOrder: index,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  Object.entries(variantImages).forEach(([variantKey, urls]) => {
    urls.forEach((url, index) => {
      const ref = db.collection(PRODUCT_IMAGES).doc();
      batch.set(ref, {
        productId,
        url,
        variantKey,
        sortOrder: index,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  });

  await batch.commit();
};

const persistPriceMatrix = async (productId: string, priceMatrix: Record<string, number>): Promise<void> => {
  const existing = await db.collection(PRODUCT_PRICE_MATRIX).where('productId', '==', productId).get();
  const batch = db.batch();
  existing.docs.forEach((d) => batch.delete(d.ref));
  Object.entries(priceMatrix).forEach(([key, price]) => {
    const ref = db.collection(PRODUCT_PRICE_MATRIX).doc();
    batch.set(ref, {
      productId,
      key,
      price: toNumber(price, 0),
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
};

const sanitizeProductPayload = (payload: Record<string, unknown>) => {
  return {
    name: String(payload['name'] ?? '').trim(),
    slug: String(payload['slug'] ?? '').trim(),
    category: String(payload['category'] ?? 'Accessories') as ProductCategory,
    basePrice: toNumber(payload['basePrice'], 0),
    originalPrice: payload['originalPrice'] === undefined ? undefined : toNumber(payload['originalPrice'], 0),
    rating: toNumber(payload['rating'], 0),
    reviewCount: toNumber(payload['reviewCount'], 0),
    inStock: Boolean(payload['inStock']),
    stockCount: toNumber(payload['stockCount'], 0),
    description: String(payload['description'] ?? ''),
    features: Array.isArray(payload['features']) ? payload['features'].map((v) => String(v)) : [],
    specs: Array.isArray(payload['specs']) ? payload['specs'] : [],
    options: Array.isArray(payload['options']) ? payload['options'] : [],
    badge: payload['badge'] ? String(payload['badge']) : undefined,
    isFeatured: Boolean(payload['isFeatured']),
  };
};

app.get('/products', async (_req: Request, res: Response) => {
  const snaps = await db.collection(PRODUCTS).orderBy('createdAt', 'desc').get();
  const products = await Promise.all(snaps.docs.map((d) => hydrateProduct(d.id)));
  res.json(products.filter(Boolean));
});

app.get('/products/:id', async (req: Request, res: Response) => {
  const productId = paramValue(req.params.id);
  const product = await hydrateProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
});

app.get('/products/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = paramValue(req.params.slug);
  const snaps = await db.collection(PRODUCTS).where('slug', '==', slug).limit(1).get();
  if (snaps.empty) return res.status(404).json({ error: 'Product not found' });
  const product = await hydrateProduct(snaps.docs[0].id);
  return res.json(product);
});

app.post('/products/:id/resolve', async (req: Request, res: Response) => {
  const productId = paramValue(req.params.id);
  const product = await hydrateProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const selectedOptions = (req.body?.selectedOptions ?? {}) as Record<string, string>;
  const selectedKeys = Object.entries(selectedOptions).map(([k, v]) => `${k}:${v}`);
  const comboKey = buildMatrixKey(selectedOptions);

  const matchedVariant =
    product.variantImages[comboKey] ??
    selectedKeys.map((k) => product.variantImages[k]).find((v) => Array.isArray(v) && v.length > 0) ??
    [];

  res.json({
    price: resolvePrice(product.priceMatrix, selectedOptions, product.basePrice),
    selectedOptions,
    images: matchedVariant.length > 0 ? matchedVariant : product.images,
    fallbackToDefault: matchedVariant.length === 0,
  });
});

app.post('/admin/products', async (req: Request, res: Response) => {
  const payload = sanitizeProductPayload(req.body ?? {});
  if (!payload.name || !payload.slug) {
    return res.status(400).json({ error: 'name and slug are required' });
  }

  const now = FieldValue.serverTimestamp();
  const docRef = db.collection(PRODUCTS).doc();
  await docRef.set({ ...payload, createdAt: now, updatedAt: now });
  await persistImages(docRef.id, (req.body?.images as string[] | undefined) ?? [], (req.body?.variantImages as Record<string, string[]> | undefined) ?? {});
  await persistPriceMatrix(docRef.id, (req.body?.priceMatrix as Record<string, number> | undefined) ?? {});
  const hydrated = await hydrateProduct(docRef.id);
  return res.status(201).json(hydrated);
});

app.put('/admin/products/:id', async (req: Request, res: Response) => {
  const productId = paramValue(req.params.id);
  const existing = await db.collection(PRODUCTS).doc(productId).get();
  if (!existing.exists) return res.status(404).json({ error: 'Product not found' });

  const payload = sanitizeProductPayload(req.body ?? {});
  await existing.ref.update({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (Array.isArray(req.body?.images) || req.body?.variantImages) {
    await persistImages(productId, (req.body?.images as string[] | undefined) ?? [], (req.body?.variantImages as Record<string, string[]> | undefined) ?? {});
  }
  if (req.body?.priceMatrix) {
    await persistPriceMatrix(productId, req.body.priceMatrix as Record<string, number>);
  }

  const hydrated = await hydrateProduct(productId);
  return res.json(hydrated);
});

app.delete('/admin/products/:id', async (req: Request, res: Response) => {
  const productId = paramValue(req.params.id);
  const batch = db.batch();
  batch.delete(db.collection(PRODUCTS).doc(productId));

  const [imagesSnap, matrixSnap] = await Promise.all([
    db.collection(PRODUCT_IMAGES).where('productId', '==', productId).get(),
    db.collection(PRODUCT_PRICE_MATRIX).where('productId', '==', productId).get(),
  ]);
  imagesSnap.docs.forEach((d) => batch.delete(d.ref));
  matrixSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return res.status(204).send();
});

app.post('/admin/uploads', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });

  const slug = String(req.body.slug ?? 'product');
  const safeName = req.file.originalname.replace(/[^\w.-]/g, '_');
  const filePath = `products/${slug}/${Date.now()}_${safeName}`;
  const fileRef = storage.file(filePath);

  await fileRef.save(req.file.buffer, {
    contentType: req.file.mimetype,
    public: true,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  const publicUrl = `https://storage.googleapis.com/${storage.name}/${filePath}`;
  return res.json({ url: publicUrl });
});

app.post('/admin/seed-defaults', async (_req: Request, res: Response) => {
  const products: Array<{
    name: string;
    slug: string;
    category: ProductCategory;
    basePrice: number;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    stockCount: number;
    description: string;
    features: string[];
    specs: ProductSpec[];
    options: ProductOption[];
    priceMatrix: Record<string, number>;
  }> = [
    {
      name: 'High Quality 3K Twill Roll Wrapped Carbon Fibre Hollow Round Tube - Gloss',
      slug: 'carbon-fibre-hollow-round-tube-gloss',
      category: 'Accessories' as ProductCategory,
      basePrice: 280,
      rating: 4.8,
      reviewCount: 142,
      inStock: true,
      stockCount: 50,
      description: 'Premium roll-wrapped carbon fibre tube with glossy finish.',
      features: ['3K Twill weave carbon fiber', 'Roll wrapped construction', 'High gloss finish'],
      specs: [{ label: 'Material', value: 'Carbon Fiber' }, { label: 'Finish', value: 'Gloss' }],
      options: [
        { name: 'OD', values: ['6MM', '8MM', '10MM'] },
        { name: 'Thickness (mm)', values: ['1.0 MM', '1.5 MM'] },
        { name: 'Length', values: ['500MM', '1000MM'] },
      ],
      priceMatrix: {
        'Length:500MM|OD:6MM|Thickness (mm):1.0 MM': 280,
        'Length:1000MM|OD:6MM|Thickness (mm):1.0 MM': 390,
        'Length:500MM|OD:8MM|Thickness (mm):1.5 MM': 420,
      },
    },
    {
      name: 'High Quality 3K Twill Roll Wrapped Carbon Fibre Plate / Sheet',
      slug: 'carbon-fibre-plate-sheet',
      category: 'Body Kits' as ProductCategory,
      basePrice: 5094,
      rating: 4.9,
      reviewCount: 87,
      inStock: true,
      stockCount: 100,
      description: 'Premium quality 3K carbon fibre sheets.',
      features: ['100% pure carbon fibre', 'Excellent machinability'],
      specs: [{ label: 'Material', value: 'Carbon Fiber Plate' }],
      options: [
        { name: 'Size', values: ['300MM X 300MM', '500MM X 300MM'] },
        { name: 'Thickness', values: ['2.0MM', '3.0MM'] },
        { name: 'Surface Finish', values: ['MATTE', 'GLOSS'] },
      ],
      priceMatrix: {
        'Size:300MM X 300MM|Surface Finish:MATTE|Thickness:2.0MM': 5094,
        'Size:300MM X 300MM|Surface Finish:GLOSS|Thickness:2.0MM': 5349,
        'Size:500MM X 300MM|Surface Finish:MATTE|Thickness:3.0MM': 6908,
      },
    },
    {
      name: 'High Quality 3K Twill Roll Wrapped Carbon Fibre Solid Round Rod',
      slug: 'carbon-fibre-solid-round-rod',
      category: 'Accessories' as ProductCategory,
      basePrice: 180,
      rating: 4.7,
      reviewCount: 64,
      inStock: true,
      stockCount: 75,
      description: 'Durable carbon fibre solid rod for structural and hobby applications.',
      features: ['Pultruded carbon fibre construction', 'Lightweight and rigid', 'Easy to cut and machine'],
      specs: [{ label: 'Material', value: 'Carbon Fiber' }, { label: 'Shape', value: 'Solid Round Rod' }],
      options: [
        { name: 'Diameter', values: ['3MM', '4MM', '5MM'] },
        { name: 'Length', values: ['500MM', '1000MM'] },
      ],
      priceMatrix: {
        'Diameter:3MM|Length:500MM': 180,
        'Diameter:3MM|Length:1000MM': 260,
        'Diameter:5MM|Length:1000MM': 420,
      },
    },
  ];

  const oldProducts = await db.collection(PRODUCTS).get();
  const cleanupBatch = db.batch();
  oldProducts.docs.forEach((d) => cleanupBatch.delete(d.ref));
  const oldImages = await db.collection(PRODUCT_IMAGES).get();
  oldImages.docs.forEach((d) => cleanupBatch.delete(d.ref));
  const oldMatrix = await db.collection(PRODUCT_PRICE_MATRIX).get();
  oldMatrix.docs.forEach((d) => cleanupBatch.delete(d.ref));
  await cleanupBatch.commit();

  const now = FieldValue.serverTimestamp();
  for (const product of products) {
    const ref = db.collection(PRODUCTS).doc();
    await ref.set({
      name: product.name,
      slug: product.slug,
      category: product.category,
      basePrice: product.basePrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock,
      stockCount: product.stockCount,
      description: product.description,
      features: product.features,
      specs: product.specs,
      options: product.options,
      createdAt: now,
      updatedAt: now,
    });
    await persistPriceMatrix(ref.id, product.priceMatrix);
    await persistImages(ref.id, [], {});
  }

  return res.json({ seeded: products.length });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export const api = onRequest({ cors: true, region: 'us-central1' }, app);
