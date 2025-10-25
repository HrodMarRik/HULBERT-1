import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '@core/services/invoice.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="invoice-list">
      <div class="header">
        <h1>Gestion des Factures</h1>
        <button class="btn-primary" routerLink="/admin/accounting/invoices/new">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Nouvelle Facture
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select [(ngModel)]="statusFilter" (change)="filterInvoices()">
            <option value="">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Type</label>
          <select [(ngModel)]="typeFilter" (change)="filterInvoices()">
            <option value="">Tous</option>
            <option value="invoice">Facture</option>
            <option value="quote">Devis</option>
            <option value="credit_note">Avoir</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Recherche</label>
          <input type="text" [(ngModel)]="searchTerm" (input)="filterInvoices()" placeholder="Numéro, client...">
        </div>
      </div>

      <div class="invoice-grid">
        <div class="invoice-card" *ngFor="let invoice of filteredInvoices" (click)="viewInvoice(invoice.id)">
          <div class="invoice-header">
            <div class="invoice-number">{{ invoice.invoice_number }}</div>
            <div class="invoice-status" [class]="'status-' + invoice.status">
              {{ getStatusLabel(invoice.status) }}
            </div>
          </div>
          <div class="invoice-client">{{ invoice.client_name }}</div>
          <div class="invoice-details">
            <div class="invoice-amount">{{ invoice.total_amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
            <div class="invoice-date">{{ invoice.issue_date | date:'dd/MM/yyyy' }}</div>
          </div>
          <div class="invoice-actions">
            <button class="btn-icon" (click)="editInvoice(invoice.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
              </svg>
            </button>
            <button class="btn-icon" (click)="downloadPDF(invoice.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>
            <button class="btn-icon" (click)="deleteInvoice(invoice.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoice-list {
      padding: 2rem;
      max-width: 1400px;
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

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      border: 1px solid #333;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #a0a0a0;
    }

    .filter-group select,
    .filter-group input {
      padding: 0.5rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .invoice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .invoice-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .invoice-card:hover {
      background: #2a2a2a;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .invoice-number {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
    }

    .invoice-status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-draft {
      background: #374151;
      color: #ffffff;
    }

    .status-sent {
      background: #1e40af;
      color: #ffffff;
    }

    .status-paid {
      background: #059669;
      color: #ffffff;
    }

    .status-overdue {
      background: #dc2626;
      color: #ffffff;
    }

    .invoice-client {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }

    .invoice-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .invoice-amount {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
    }

    .invoice-date {
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    .invoice-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #a0a0a0;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-icon:hover {
      background: #333;
      color: #ffffff;
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  statusFilter = '';
  typeFilter = '';
  searchTerm = '';

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.filteredInvoices = invoices;
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
      }
    });
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesStatus = !this.statusFilter || invoice.status === this.statusFilter;
      const matchesType = !this.typeFilter || invoice.document_type === this.typeFilter;
      const matchesSearch = !this.searchTerm || 
        invoice.invoice_number.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesType && matchesSearch;
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'sent': 'Envoyée',
      'paid': 'Payée',
      'overdue': 'En retard'
    };
    return labels[status] || status;
  }

  viewInvoice(id: number) {
    // TODO: Navigate to invoice detail
    console.log('View invoice:', id);
  }

  editInvoice(id: number, event: Event) {
    event.stopPropagation();
    // TODO: Navigate to invoice edit
    console.log('Edit invoice:', id);
  }

  downloadPDF(id: number, event: Event) {
    event.stopPropagation();
    this.invoiceService.downloadPDF(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
      }
    });
  }

  deleteInvoice(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.invoiceService.deleteInvoice(id).subscribe({
        next: () => {
          this.loadInvoices();
        },
        error: (error) => {
          console.error('Error deleting invoice:', error);
        }
      });
    }
  }
}
