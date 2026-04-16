import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bulk-enquiry-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay-backdrop"></div>
    <div class="enquiry-modal">
      <div class="enquiry-modal__header">
        <h2 class="enquiry-modal__title">Bulk Order Enquiry</h2>
        <button class="enquiry-modal__close" (click)="close.emit()" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="enquiry-modal__body">
        @if (!submitted) {
          <p class="enquiry-subtext">Request a custom quote for large orders of <strong>{{ productName }}</strong>. Fill out the details below and our team will get back to you.</p>

          <form (ngSubmit)="onSubmit()" #f="ngForm" class="enquiry-form">
            <div class="form-row">
              <div class="form-group">
                <label>Name</label>
                <input type="text" [(ngModel)]="formData.name" name="name" required class="form-control" placeholder="John Doe">
              </div>
              <div class="form-group">
                <label>Company (Optional)</label>
                <input type="text" [(ngModel)]="formData.company" name="company" class="form-control" placeholder="Your Company">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="formData.email" name="email" required class="form-control" placeholder="john@example.com">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="formData.phone" name="phone" required class="form-control" placeholder="+91 98765 43210">
              </div>
            </div>

            <div class="form-group">
              <label>Expected Quantity</label>
              <input type="number" [(ngModel)]="formData.quantity" name="quantity" required min="10" class="form-control" placeholder="e.g., 50">
            </div>

            <div class="form-group">
              <label>Current Selected Variant</label>
              <input type="text" [value]="getVariantString()" disabled class="form-control variant-input">
            </div>

            <div class="form-group">
              <label>Additional Details / Custom Requirements</label>
              <textarea [(ngModel)]="formData.message" name="message" rows="4" class="form-control" placeholder="Describe your specific needs or timelines..."></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn--primary btn--full" [disabled]="!f.valid">Submit Enquiry</button>
            </div>
          </form>
        } @else {
          <div class="enquiry-success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <h3>Enquiry Sent Successfully!</h3>
            <p>Thank you, {{ formData.name }}. Our team will review your requirements for {{ productName }} and contact you shortly.</p>
            <button class="btn btn--outline" (click)="close.emit()">Close Window</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .enquiry-modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: var(--z-modal);
      width: min(95vw, 600px);
      max-height: 92vh;
      background: #0f0f24;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: var(--r-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: fadeInScale 0.3s ease both;
      box-shadow: 0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08);
      
      &__header {
        display: flex; align-items: center; justify-content: space-between;
        padding: var(--sp-lg);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        background: rgba(59,130,246,0.06);
      }
      
      &__title { font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: #f0f0f5; margin: 0; }
      
      &__close {
        width: 32px; height: 32px;
        border-radius: var(--r-sm); border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
        display: flex; align-items: center; justify-content: center; color: #9ca3af;
        transition: all var(--tr-fast); cursor: pointer;
        &:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.35); color: var(--clr-error); }
      }

      &__body {
        padding: var(--sp-xl);
        overflow-y: auto;
        flex: 1;
        min-height: 0;
      }
    }

    .enquiry-subtext {
      font-size: 13px; color: var(--clr-text-muted); margin-bottom: var(--sp-lg); line-height: 1.6;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-md); }
    @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
    
    .form-group {
      margin-bottom: var(--sp-md);
      label { display: block; font-family: var(--font-heading); font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 6px; }
    }

    .form-control {
      width: 100%; padding: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: var(--r-md);
      color: #f0f0f5; font-size: 14px;
      transition: all 0.2s;
      &:focus { outline: none; border-color: var(--clr-primary); background: rgba(59,130,246,0.05); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      &.variant-input {
        background: rgba(0,0,0,0.3); color: var(--clr-primary); font-family: var(--font-heading); letter-spacing: 0.5px;
      }
    }

    textarea.form-control { resize: vertical; }

    .form-actions { margin-top: var(--sp-lg); }

    .enquiry-success {
      text-align: center;
      padding: var(--sp-xl) 0;
      svg { color: var(--clr-success); margin-bottom: var(--sp-md); }
      h3 { font-family: var(--font-heading); font-size: 20px; color: #fff; margin-bottom: var(--sp-sm); }
      p { color: var(--clr-text-dim); font-size: 14px; line-height: 1.6; margin-bottom: var(--sp-xl); }
      .btn { min-width: 200px; display: inline-flex; justify-content: center; }
    }
  `]
})
export class BulkEnquiryDialogComponent {
  @Input() productName: string = '';
  @Input() selectedVariant: Record<string, string> = {};
  @Output() close = new EventEmitter<void>();

  submitted = false;

  formData = {
    name: '',
    company: '',
    email: '',
    phone: '',
    quantity: null,
    message: ''
  };

  getVariantString(): string {
    if (!this.selectedVariant || Object.keys(this.selectedVariant).length === 0) return 'Base Product';
    return Object.entries(this.selectedVariant).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }

  onSubmit(): void {
    // In a real app, send formData via HttpClient
    setTimeout(() => {
      this.submitted = true;
    }, 600);
  }
}
