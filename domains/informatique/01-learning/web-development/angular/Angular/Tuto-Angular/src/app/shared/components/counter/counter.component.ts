import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="counter-container">
      <h2>Compteur Angular</h2>
      
      <div class="counter-display">
        <span class="counter-value">{{ count() }}</span>
        <span class="counter-label">clics</span>
      </div>
      
      <div class="counter-info">
        <p>Double: {{ doubleCount() }}</p>
        <p>Triple: {{ tripleCount() }}</p>
        <p>Est pair: {{ isEven() ? 'Oui' : 'Non' }}</p>
      </div>
      
      <div class="counter-actions">
        <button (click)="increment()" class="btn btn-primary">
          +1
        </button>
        <button (click)="decrement()" class="btn btn-secondary">
          -1
        </button>
        <button (click)="reset()" class="btn btn-danger">
          Reset
        </button>
      </div>
      
      <div class="counter-history">
        <h4>Historique</h4>
        <div *ngIf="history().length === 0" class="no-history">
          Aucun historique
        </div>
        <div *ngFor="let entry of history(); let i = index" class="history-entry">
          {{ i + 1 }}. {{ entry.action }} → {{ entry.value }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .counter-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    
    .counter-display {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin: 20px 0;
    }
    
    .counter-value {
      font-size: 3em;
      font-weight: bold;
      display: block;
    }
    
    .counter-label {
      font-size: 1.2em;
      opacity: 0.8;
    }
    
    .counter-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .counter-info p {
      margin: 5px 0;
      font-size: 1.1em;
    }
    
    .counter-actions {
      margin: 20px 0;
    }
    
    .btn {
      padding: 12px 24px;
      margin: 5px;
      border: none;
      border-radius: 6px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .btn-primary {
      background-color: #28a745;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .counter-history {
      background: #e9ecef;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: left;
    }
    
    .counter-history h4 {
      margin-top: 0;
      text-align: center;
    }
    
    .no-history {
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }
    
    .history-entry {
      padding: 5px 0;
      border-bottom: 1px solid #dee2e6;
    }
    
    .history-entry:last-child {
      border-bottom: none;
    }
  `]
})
export class CounterComponent {
  // Signal principal pour le compteur
  count = signal(0);
  
  // Signal pour l'historique
  history = signal<Array<{action: string, value: number}>>([]);
  
  // Signals calculés
  doubleCount = computed(() => this.count() * 2);
  tripleCount = computed(() => this.count() * 3);
  isEven = computed(() => this.count() % 2 === 0);
  
  // Méthodes
  increment() {
    this.count.update(value => value + 1);
    this.addToHistory('Incrément', this.count());
  }
  
  decrement() {
    this.count.update(value => value - 1);
    this.addToHistory('Décrément', this.count());
  }
  
  reset() {
    this.count.set(0);
    this.addToHistory('Reset', 0);
  }
  
  private addToHistory(action: string, value: number) {
    this.history.update(history => [
      { action, value },
      ...history.slice(0, 9) // Garder seulement les 10 dernières actions
    ]);
  }
}
