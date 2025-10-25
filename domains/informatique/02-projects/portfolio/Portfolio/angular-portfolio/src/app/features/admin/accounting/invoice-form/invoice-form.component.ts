import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService, InvoiceCreate, InvoiceLineCreate } from '@core/services/invoice.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="invoice-form">
      <div class="header">
        <h1>{{ isEdit ? 'Modifier la Facture' : 'Nouvelle Facture' }}</h1>
        <button class="btn-secondary" routerLink="/admin/accounting/invoices">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
          </svg>
          Retour
        </button>
      </div>

      <form (ngSubmit)="saveInvoice()" #invoiceForm="ngForm">
        <div class="form-grid">
          <div class="form-section">
            <h2>Informations Générales</h2>
            <div class="form-group">
              <label>Type de Document</label>
              <select [(ngModel)]="invoice.document_type" name="document_type" required>
                <option value="invoice">Facture</option>
                <option value="quote">Devis</option>
                <option value="credit_note">Avoir</option>
              </select>
            </div>
            <div class="form-group">
              <label>Numéro de Facture</label>
              <input type="text" [(ngModel)]="invoice.invoice_number" name="invoice_number" required>
            </div>
            <div class="form-group">
              <label>Date d'Émission</label>
              <input type="date" [(ngModel)]="invoice.issue_date" name="issue_date" required>
            </div>
            <div class="form-group">
              <label>Date d'Échéance</label>
              <input type="date" [(ngModel)]="invoice.due_date" name="due_date">
            </div>
          </div>

          <div class="form-section">
            <h2>Informations Client</h2>
            <div class="form-group">
              <label>Nom du Client</label>
              <input type="text" [(ngModel)]="invoice.client_name" name="client_name" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="invoice.client_email" name="client_email">
            </div>
            <div class="form-group">
              <label>Adresse</label>
              <textarea [(ngModel)]="invoice.client_address" name="client_address" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Conditions de Paiement</label>
              <input type="text" [(ngModel)]="invoice.payment_terms" name="payment_terms">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Lignes de Facture</h2>
          <div class="invoice-lines">
            <div class="line-header">
              <span>Description</span>
              <span>Quantité</span>
              <span>Prix Unitaire</span>
              <span>Taux TVA</span>
              <span>Total</span>
              <span>Actions</span>
            </div>
            <div class="line-item" *ngFor="let line of invoice.invoice_lines; let i = index">
              <input type="text" [(ngModel)]="line.description" name="line_description_{{i}}" required>
              <input type="number" [(ngModel)]="line.quantity" name="line_quantity_{{i}}" (input)="calculateLineTotal(i)" required>
              <input type="number" [(ngModel)]="line.unit_price" name="line_unit_price_{{i}}" (input)="calculateLineTotal(i)" required>
              <input type="number" [(ngModel)]="line.tax_rate" name="line_tax_rate_{{i}}" (input)="calculateLineTotal(i)" required>
              <span class="line-total">{{ line.total_price | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              <button type="button" class="btn-icon" (click)="removeLine(i)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
              </button>
            </div>
            <button type="button" class="btn-secondary" (click)="addLine()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Ajouter une Ligne
            </button>
          </div>
        </div>

        <div class="form-section">
          <h2>Totaux</h2>
          <div class="totals">
            <div class="total-line">
              <span>Sous-total</span>
              <span>{{ invoice.subtotal | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
            </div>
            <div class="total-line">
              <span>TVA</span>
              <span>{{ invoice.total_tax | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
            </div>
            <div class="total-line total">
              <span>Total</span>
              <span>{{ invoice.total_amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" routerLink="/admin/accounting/invoices">Annuler</button>
          <button type="submit" class="btn-primary" [disabled]="!invoiceForm.form.valid">
            {{ isEdit ? 'Modifier' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .invoice-form {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      background: #0f0f0f;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .btn-primary:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #333;
    }

    .btn-secondary:hover {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .form-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-section h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .invoice-lines {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 1rem;
    }

    .line-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 0.5rem;
      font-weight: 600;
      color: #ffffff;
      border-bottom: 1px solid #333;
      margin-bottom: 1rem;
    }

    .line-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 0.5rem;
      align-items: center;
    }

    .line-item input {
      padding: 0.5rem;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .line-total {
      font-weight: 600;
      color: #ffffff;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #dc2626;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-icon:hover {
      background: #b91c1c;
    }

    .totals {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 1rem;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #333;
    }

    .total-line.total {
      font-weight: 600;
      color: #ffffff;
      border-bottom: none;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .line-header,
      .line-item {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  invoice: InvoiceCreate = {
    invoice_number: '',
    document_type: 'invoice',
    client_name: '',
    issue_date: new Date(),
    subtotal: 0,
    total_tax: 0,
    total_amount: 0,
    currency: 'EUR',
    auto_generated: false,
    invoice_lines: []
  };
  isEdit = false;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    // TODO: Load invoice data if editing
  }

  addLine() {
    this.invoice.invoice_lines.push({
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      tax_rate: 20,
      tax_amount: 0
    });
  }

  removeLine(index: number) {
    this.invoice.invoice_lines.splice(index, 1);
    this.calculateTotals();
  }

  calculateLineTotal(index: number) {
    const line = this.invoice.invoice_lines[index];
    line.total_price = line.quantity * line.unit_price;
    line.tax_amount = line.total_price * (line.tax_rate / 100);
    this.calculateTotals();
  }

  calculateTotals() {
    this.invoice.subtotal = this.invoice.invoice_lines.reduce((sum, line) => sum + line.total_price, 0);
    this.invoice.total_tax = this.invoice.invoice_lines.reduce((sum, line) => sum + line.tax_amount, 0);
    this.invoice.total_amount = this.invoice.subtotal + this.invoice.total_tax;
  }

  saveInvoice() {
    if (this.isEdit) {
      // TODO: Update invoice
      console.log('Update invoice:', this.invoice);
    } else {
      this.invoiceService.createInvoice(this.invoice).subscribe({
        next: (invoice) => {
          console.log('Invoice created:', invoice);
          // TODO: Navigate to invoice list
        },
        error: (error) => {
          console.error('Error creating invoice:', error);
        }
      });
    }
  }
}
