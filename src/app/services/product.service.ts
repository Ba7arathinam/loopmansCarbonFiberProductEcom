import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';
import { Product, ProductCategory } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private activeApiBase = environment.backendApiBaseUrl;
  private readonly fallbackApiBase = (environment as any).backendApiFallbackUrl as string | undefined;
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  private loaded = false;

  products$: Observable<Product[]> = this.productsSubject.asObservable();

  private shouldUseFallback(err: unknown): boolean {
    if (!this.fallbackApiBase) return false;
    return err instanceof HttpErrorResponse && err.status === 0 && this.activeApiBase !== this.fallbackApiBase;
  }

  private withFallback$<T>(requestFactory: (baseUrl: string) => Observable<T>): Observable<T> {
    return requestFactory(this.activeApiBase).pipe(
      catchError((err) => {
        if (!this.shouldUseFallback(err)) {
          return throwError(() => err);
        }
        this.activeApiBase = this.fallbackApiBase as string;
        return requestFactory(this.activeApiBase);
      })
    );
  }

  private async withFallbackPromise<T>(requestFactory: (baseUrl: string) => Promise<T>): Promise<T> {
    try {
      return await requestFactory(this.activeApiBase);
    } catch (err) {
      if (!this.shouldUseFallback(err)) throw err;
      this.activeApiBase = this.fallbackApiBase as string;
      return requestFactory(this.activeApiBase);
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const products = await this.withFallbackPromise((baseUrl) =>
      firstValueFrom(this.http.get<Product[]>(`${baseUrl}/products`))
    );
    this.productsSubject.next(products);
    this.loaded = true;
  }

  // ── Read helpers ────────────────────────────────────────────────────────
  getAll(): Observable<Product[]> {
    this.ensureLoaded();
    return this.products$;
  }

  getById(id: string): Observable<Product | undefined> {
    return this.withFallback$((baseUrl) => this.http.get<Product>(`${baseUrl}/products/${id}`)).pipe(
      map((p) => p ?? undefined)
    );
  }

  getBySlug(slug: string): Observable<Product | undefined> {
    return this.withFallback$((baseUrl) => this.http.get<Product>(`${baseUrl}/products/by-slug/${slug}`)).pipe(
      map((p) => p ?? undefined)
    );
  }

  getFeatured(): Observable<Product[]> {
    this.ensureLoaded();
    return this.getAll().pipe(
      map(products => products.filter(p => p.isFeatured))
    );
  }

  getByCategory(category: string): Observable<Product[]> {
    this.ensureLoaded();
    if (category === 'All') return this.getAll();
    return this.getAll().pipe(
      map(products => products.filter(p => p.category === category))
    );
  }

  getRelated(product: Product, limit = 4): Observable<Product[]> {
    this.ensureLoaded();
    return this.products$.pipe(
      map(products =>
        products
          .filter(p => p.category === product.category && p.id !== product.id)
          .slice(0, limit)
      )
    );
  }

  getCategories(): string[] {
    return ['All', 'Body Kits', 'Spoilers', 'Hoods', 'Interior', 'Accessories'];
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────
  async addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const created = await this.withFallbackPromise((baseUrl) =>
      firstValueFrom(this.http.post<Product>(`${baseUrl}/admin/products`, data))
    );
    await this.refresh();
    return created.id;
  }

  async updateProduct(id: string, changes: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    await this.withFallbackPromise((baseUrl) =>
      firstValueFrom(this.http.put(`${baseUrl}/admin/products/${id}`, changes))
    );
    await this.refresh();
  }

  async deleteProduct(id: string): Promise<void> {
    await this.withFallbackPromise((baseUrl) =>
      firstValueFrom(this.http.delete(`${baseUrl}/admin/products/${id}`))
    );
    await this.refresh();
  }

  // ── Backend-managed image upload ────────────────────────────────────────
  uploadImage(
    file: File,
    slug: string,
    onProgress?: (pct: number) => void
  ): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('slug', slug);
    onProgress?.(25);
    return this.withFallbackPromise((baseUrl) =>
      firstValueFrom(
        this.http.post<{ url: string }>(`${baseUrl}/admin/uploads`, form).pipe(
          map((res) => {
            onProgress?.(100);
            return res.url;
          })
        )
      )
    );
  }

  /**
   * Delete an image from Firebase Storage by its full download URL.
   * Silently ignores errors (e.g. already deleted or external URL).
   */
  async deleteImage(downloadUrl: string): Promise<void> {
    void downloadUrl;
  }

  resolveVariant(productId: string, selectedOptions: Record<string, string>): Observable<{
    price: number;
    selectedOptions: Record<string, string>;
    images: string[];
    fallbackToDefault: boolean;
  }> {
    return this.withFallback$((baseUrl) =>
      this.http.post<{
        price: number;
        selectedOptions: Record<string, string>;
        images: string[];
        fallbackToDefault: boolean;
      }>(`${baseUrl}/products/${productId}/resolve`, { selectedOptions })
    );
  }

  seedDefaults(): Promise<number> {
    return this.withFallbackPromise((baseUrl) =>
      firstValueFrom(
        this.http.post<{ seeded: number }>(`${baseUrl}/admin/seed-defaults`, {}).pipe(map((res) => res.seeded))
      )
    );
  }
}