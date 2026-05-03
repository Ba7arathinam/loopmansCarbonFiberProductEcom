import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Product, ProductCategory, ProductBadge } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductSeederService } from '../../services/product-seeder.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

type AdminView = 'list' | 'add' | 'edit' | 'matrix' | 'variantImages';

interface UploadItem {
  file: File;
  preview: string;   // DataURL for display before upload
  progress: number;  // 0-100
  url?: string;      // resolved Firebase Storage URL after upload
  error?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CurrencyInrPipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit, OnDestroy {
  view: AdminView = 'list';
  products: Product[] = [];
  editingProduct: Product | null = null;
  deleteConfirmId: string | null = null;
  successMessage = '';
  errorMessage = '';
  matrixProduct: Product | null = null;
  matrixKeys: string[] = [];
  matrixEdits: Record<string, number> = {};

  // Image upload state
  existingImages: string[] = [];       // already-saved URLs (from DB)
  pendingUploads: UploadItem[] = [];   // newly selected local files
  saving = false;
  seeding = false;
  seedDone = false;

  // Variant images state
  variantImgProduct: Product | null = null;
  variantImgEdits: Record<string, string[]> = {};
  newVariantKey = '';
  pendingVariantUploads: UploadItem[] = [];

  form!: FormGroup;

  readonly categories: ProductCategory[] = ['Body Kits', 'Spoilers', 'Hoods', 'Interior', 'Accessories'];
  readonly badges: (ProductBadge | '')[] = ['', 'New', 'Sale', 'Hot', 'Featured'];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private seederService: ProductSeederService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.productService.products$.pipe(takeUntil(this.destroy$)).subscribe(p => this.products = p);
    this.productService.refresh();
    this.initForm();
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  initForm(product?: Product): void {
    this.form = this.fb.group({
      name:          [product?.name ?? '', [Validators.required, Validators.minLength(5)]],
      slug:          [product?.slug ?? '', [Validators.required]],
      category:      [product?.category ?? 'Accessories', Validators.required],
      basePrice:     [product?.basePrice ?? 0, [Validators.required, Validators.min(1)]],
      originalPrice: [product?.originalPrice ?? null],
      rating:        [product?.rating ?? 4.5, [Validators.min(0), Validators.max(5)]],
      reviewCount:   [product?.reviewCount ?? 0, Validators.min(0)],
      inStock:       [product?.inStock ?? true],
      stockCount:    [product?.stockCount ?? 50, Validators.min(0)],
      description:   [product?.description ?? '', Validators.required],
      features:      [product?.features?.join('\n') ?? ''],
      badge:         [product?.badge ?? ''],
      isFeatured:    [product?.isFeatured ?? false],
      optionsJson:   [product?.options ? JSON.stringify(product.options, null, 2) : '[]'],
    });
    // Reset image state
    this.existingImages = product?.images ? [...product.images] : [];
    this.pendingUploads = [];
  }

  autoSlug(): void {
    const name = this.form.get('name')?.value ?? '';
    this.form.get('slug')?.setValue(
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    );
  }

  // ── Image Management ────────────────────────────────────────────────────────
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        this.pendingUploads.push({
          file,
          preview: e.target?.result as string,
          progress: 0,
        });
      };
      reader.readAsDataURL(file);
    });
    input.value = ''; // reset so same file can be re-selected
  }

  removeExistingImage(idx: number): void {
    this.existingImages.splice(idx, 1);
  }

  removePendingUpload(idx: number): void {
    this.pendingUploads.splice(idx, 1);
  }

  // ── View transitions ───────────────────────────────────────────────────────
  showAdd(): void {
    this.editingProduct = null;
    this.initForm();
    this.clearMessages();
    this.view = 'add';
  }

  showEdit(product: Product): void {
    this.editingProduct = product;
    this.initForm(product);
    this.clearMessages();
    this.view = 'edit';
  }

  showList(): void {
    this.editingProduct = null;
    this.view = 'list';
    this.clearMessages();
  }

  showMatrix(product: Product): void {
    this.matrixProduct = product;
    this.matrixEdits = { ...(product.priceMatrix ?? {}) };
    this.matrixKeys = Object.keys(this.matrixEdits).sort();
    this.view = 'matrix';
  }

  showVariantImages(product: Product): void {
    this.variantImgProduct = product;
    this.variantImgEdits = product.variantImages
      ? Object.fromEntries(Object.entries(product.variantImages).map(([k, v]) => [k, [...v]]))
      : {};
    this.newVariantKey = '';
    this.pendingVariantUploads = [];
    this.view = 'variantImages';
  }

  // ── Save product ───────────────────────────────────────────────────────────
  async save(): Promise<void> {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      this.errorMessage = 'Please fix the highlighted errors in the form before saving.';
      return; 
    }
    this.saving = true;
    this.errorMessage = '';

    try {
      const v = this.form.value;
      const slug = v.slug as string;

      // Upload pending images first
      const uploadedUrls: string[] = [];
      for (const item of this.pendingUploads) {
        item.progress = 1;
        const url = await this.productService.uploadImage(item.file, slug, pct => item.progress = pct);
        item.url = url;
        uploadedUrls.push(url);
      }

      const allImages = [...this.existingImages, ...uploadedUrls];

      let options: any[] = [];
      try { options = JSON.parse(v.optionsJson || '[]'); } catch { options = []; }

      const payload = {
        name: v.name as string,
        slug,
        category: v.category as ProductCategory,
        basePrice: +v.basePrice,
        originalPrice: v.originalPrice ? +v.originalPrice : undefined,
        rating: +v.rating,
        reviewCount: +v.reviewCount,
        inStock: v.inStock as boolean,
        stockCount: +v.stockCount,
        description: v.description as string,
        features: (v.features as string).split('\n').map((s: string) => s.trim()).filter(Boolean),
        specs: this.editingProduct?.specs ?? [],
        images: allImages,
        badge: v.badge || undefined,
        isFeatured: v.isFeatured as boolean,
        options: options.length > 0 ? options : undefined,
        variantImages: this.editingProduct?.variantImages ?? {},
        priceMatrix: this.editingProduct?.priceMatrix ?? {},
      };

      if (this.editingProduct) {
        await this.productService.updateProduct(this.editingProduct.id, payload);
        this.successMessage = `✓ "${v.name}" updated successfully!`;
      } else {
        await this.productService.addProduct(payload);
        this.successMessage = `✓ "${v.name}" added successfully!`;
      }
      this.showList();
    } catch (err: any) {
      this.errorMessage = `Save failed: ${err?.message ?? err}`;
    } finally {
      this.saving = false;
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  confirmDelete(id: string): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  async doDelete(id: string): Promise<void> {
    const p = this.products.find(x => x.id === id);
    try {
      await this.productService.deleteProduct(id);
      this.deleteConfirmId = null;
      this.successMessage = `✓ "${p?.name}" deleted.`;
    } catch (err: any) {
      this.errorMessage = `Delete failed: ${err?.message ?? err}`;
    }
  }

  // ── Price Matrix Edit ───────────────────────────────────────────────────────
  async saveMatrix(): Promise<void> {
    if (!this.matrixProduct) return;
    this.saving = true;
    try {
      await this.productService.updateProduct(this.matrixProduct.id, { priceMatrix: { ...this.matrixEdits } });
      this.successMessage = `✓ Price matrix updated for "${this.matrixProduct.name}"!`;
      this.showList();
    } catch (err: any) {
      this.errorMessage = `Matrix save failed: ${err?.message ?? err}`;
    } finally {
      this.saving = false;
    }
  }

  matrixKeyLabel(key: string): string {
    return key.split('|').map(s => s.split(':')[1] ?? s).join(' • ');
  }

  updateMatrixPrice(key: string, val: string): void {
    const n = parseFloat(val);
    if (!isNaN(n)) this.matrixEdits[key] = n;
  }

  // ── Variant Images ──────────────────────────────────────────────────────────
  getVariantImageKeys(): string[] {
    return Object.keys(this.variantImgEdits);
  }

  onVariantFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        this.pendingVariantUploads.push({
          file,
          preview: e.target?.result as string,
          progress: 0,
        });
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeVariantUpload(idx: number): void {
    this.pendingVariantUploads.splice(idx, 1);
  }

  removeVariantUrl(key: string, idx: number): void {
    this.variantImgEdits[key].splice(idx, 1);
    if (this.variantImgEdits[key].length === 0) delete this.variantImgEdits[key];
  }

  async saveVariantImages(): Promise<void> {
    if (!this.variantImgProduct) return;
    const key = this.newVariantKey.trim();
    
    if (this.pendingVariantUploads.length > 0 && !key) {
      this.errorMessage = 'Please enter an Option Key for the new variant images.';
      return;
    }

    this.saving = true;
    try {
      // Upload any pending variant images
      if (this.pendingVariantUploads.length > 0 && key) {
        const slug = this.variantImgProduct.slug;
        const uploadedUrls: string[] = [];
        
        for (const item of this.pendingVariantUploads) {
          item.progress = 1;
          const url = await this.productService.uploadImage(item.file, `${slug}_variant`, pct => item.progress = pct);
          item.url = url;
          uploadedUrls.push(url);
        }

        if (!this.variantImgEdits[key]) {
          this.variantImgEdits[key] = [];
        }
        this.variantImgEdits[key] = [...this.variantImgEdits[key], ...uploadedUrls];
        this.pendingVariantUploads = [];
      }

      await this.productService.updateProduct(this.variantImgProduct.id, {
        variantImages: { ...this.variantImgEdits },
      });
      this.successMessage = `✓ Variant images saved for "${this.variantImgProduct.name}"!`;
      this.showList();
    } catch (err: any) {
      this.errorMessage = `Save failed: ${err?.message ?? err}`;
    } finally {
      this.saving = false;
    }
  }

  // ── Seeder ─────────────────────────────────────────────────────────────────
  async seedProducts(): Promise<void> {
    if (this.seeding) return;
    this.seeding = true;
    this.errorMessage = '';
    try {
      const count = await this.seederService.seedInitialProducts();
      if (count > 0) {
        this.successMessage = `✓ ${count} products seeded to Firestore successfully!`;
        this.seedDone = true;
      } else {
        this.errorMessage = 'Products already exist — seeding skipped.';
      }
    } catch (err: any) {
      this.errorMessage = `Seeding failed: ${err?.message ?? err}`;
    } finally {
      this.seeding = false;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getComboCount(product: Product): number {
    if (!product.options) return 0;
    return product.options.reduce((acc, opt) => acc * opt.values.length, 1);
  }

  getPriceRange(product: Product): { min: number; max: number } | null {
    if (!product.priceMatrix) return null;
    const vals = Object.values(product.priceMatrix);
    if (vals.length === 0) return null;
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }

  hasVariantImages(product: Product): boolean {
    return !!product.variantImages && Object.keys(product.variantImages).length > 0;
  }

  clearMessages(): void { this.successMessage = ''; this.errorMessage = ''; }

  trackById(_i: number, p: Product): string { return p.id; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
