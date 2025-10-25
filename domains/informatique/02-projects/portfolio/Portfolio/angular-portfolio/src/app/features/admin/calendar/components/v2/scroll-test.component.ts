import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scroll-test-container">
      <h1>🧪 Test de Scroll</h1>
      
      <div class="test-section">
        <h2>Test 1: Scroll vertical simple</h2>
        <div class="scroll-box">
          <div *ngFor="let item of testItems" class="test-item">
            Item {{ item }} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h2>Test 2: Scroll avec hauteur fixe</h2>
        <div class="fixed-height-scroll">
          <div *ngFor="let item of testItems" class="test-item">
            Item {{ item }} - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h2>Test 3: Scroll avec overflow-y: auto</h2>
        <div class="auto-scroll">
          <div *ngFor="let item of testItems" class="test-item">
            Item {{ item }} - Ut enim ad minim veniam, quis nostrud exercitation ullamco.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h2>Test 4: Scroll avec min-height</h2>
        <div class="min-height-scroll">
          <div *ngFor="let item of testItems" class="test-item">
            Item {{ item }} - Duis aute irure dolor in reprehenderit in voluptate velit esse.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scroll-test-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
      background: #0f172a;
      min-height: 100vh;
      color: #f1f5f9;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 32px;
      text-align: center;
      color: #3b82f6;
    }

    .test-section {
      margin-bottom: 48px;
      padding: 20px;
      background: #1a1f2e;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .test-section h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #e2e8f0;
    }

    .scroll-box {
      height: 200px;
      overflow-y: scroll;
      background: #1e293b;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 16px;
    }

    .fixed-height-scroll {
      height: 300px;
      overflow-y: auto;
      background: #1e293b;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 16px;
    }

    .auto-scroll {
      max-height: 250px;
      overflow-y: auto;
      background: #1e293b;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 16px;
    }

    .min-height-scroll {
      min-height: 400px;
      overflow-y: auto;
      background: #1e293b;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 16px;
    }

    .test-item {
      padding: 12px;
      margin-bottom: 8px;
      background: #374151;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
      font-size: 14px;
      line-height: 1.4;
    }

    .test-item:hover {
      background: #4b5563;
      transform: translateX(4px);
      transition: all 0.2s ease;
    }

    /* Scrollbar personnalisée */
    .scroll-box::-webkit-scrollbar,
    .fixed-height-scroll::-webkit-scrollbar,
    .auto-scroll::-webkit-scrollbar,
    .min-height-scroll::-webkit-scrollbar {
      width: 12px;
    }

    .scroll-box::-webkit-scrollbar-track,
    .fixed-height-scroll::-webkit-scrollbar-track,
    .auto-scroll::-webkit-scrollbar-track,
    .min-height-scroll::-webkit-scrollbar-track {
      background: #1a1f2e;
      border-radius: 6px;
    }

    .scroll-box::-webkit-scrollbar-thumb,
    .fixed-height-scroll::-webkit-scrollbar-thumb,
    .auto-scroll::-webkit-scrollbar-thumb,
    .min-height-scroll::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 6px;
      border: 2px solid #1a1f2e;
    }

    .scroll-box::-webkit-scrollbar-thumb:hover,
    .fixed-height-scroll::-webkit-scrollbar-thumb:hover,
    .auto-scroll::-webkit-scrollbar-thumb:hover,
    .min-height-scroll::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }
  `]
})
export class ScrollTestComponent {
  testItems = Array.from({ length: 50 }, (_, i) => i + 1);
}
