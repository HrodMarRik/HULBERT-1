import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="setup-section">
      <div class="container">
        <h2>Configuration Gaming</h2>
        
        <div class="setup-content">
          <div class="pc-specs">
            <h3>Configuration PC</h3>
            <div class="specs-grid">
              <div class="spec-item" *ngFor="let spec of pcSpecs">
                <div class="spec-icon">{{ spec.icon }}</div>
                <div class="spec-content">
                  <h4>{{ spec.component }}</h4>
                  <p>{{ spec.model }}</p>
                  <span class="spec-note">{{ spec.note }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="peripherals">
            <h3>Périphériques</h3>
            <div class="peripherals-grid">
              <div class="peripheral-item" *ngFor="let peripheral of peripherals">
                <div class="peripheral-icon">{{ peripheral.icon }}</div>
                <div class="peripheral-content">
                  <h4>{{ peripheral.name }}</h4>
                  <p>{{ peripheral.model }}</p>
                  <div class="peripheral-specs">
                    <span *ngFor="let spec of peripheral.specs">{{ spec }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="game-settings">
            <h3>Paramètres de Jeu</h3>
            <div class="settings-grid">
              <div class="setting-category" *ngFor="let category of gameSettings">
                <h4>{{ category.name }}</h4>
                <div class="setting-items">
                  <div class="setting-item" *ngFor="let setting of category.settings">
                    <span class="setting-name">{{ setting.name }}</span>
                    <span class="setting-value">{{ setting.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="setup-image">
            <h3>Setup Photo</h3>
            <div class="image-placeholder">
              <div class="placeholder-content">
                <span class="placeholder-icon">🖥️</span>
                <p>Photo du setup gaming</p>
                <small>Configuration optimisée pour Valorant</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .setup-section {
      padding: 50px 0;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    h2 {
      text-align: center;
      margin-bottom: 50px;
      font-size: 2.5rem;
      font-weight: 700;
      color: #ff4655;
    }

    .setup-content {
      display: grid;
      gap: 40px;
    }

    h3 {
      font-size: 1.8rem;
      margin-bottom: 30px;
      color: #ff4655;
      text-align: center;
    }

    .specs-grid,
    .peripherals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .spec-item,
    .peripheral-item {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: transform 0.3s ease;
    }

    .spec-item:hover,
    .peripheral-item:hover {
      transform: translateY(-5px);
      border-color: #ff4655;
    }

    .spec-icon,
    .peripheral-icon {
      font-size: 2.5rem;
      width: 60px;
      text-align: center;
    }

    .spec-content,
    .peripheral-content {
      flex: 1;
    }

    .spec-content h4,
    .peripheral-content h4 {
      margin: 0 0 8px 0;
      color: white;
      font-size: 1.2rem;
    }

    .spec-content p,
    .peripheral-content p {
      margin: 0 0 10px 0;
      color: #ff4655;
      font-weight: 600;
    }

    .spec-note {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .peripheral-specs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .peripheral-specs span {
      background: rgba(255, 70, 85, 0.2);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .setting-category {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
    }

    .setting-category h4 {
      margin: 0 0 20px 0;
      color: #ff4655;
      font-size: 1.3rem;
      text-align: center;
    }

    .setting-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 70, 85, 0.2);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-name {
      color: white;
      font-weight: 500;
    }

    .setting-value {
      color: #ff4655;
      font-weight: 600;
      font-family: monospace;
    }

    .setup-image {
      text-align: center;
    }

    .image-placeholder {
      background: rgba(15, 25, 35, 0.8);
      border: 2px dashed rgba(255, 70, 85, 0.5);
      border-radius: 15px;
      padding: 60px 40px;
      margin-top: 20px;
    }

    .placeholder-content {
      color: rgba(255, 255, 255, 0.7);
    }

    .placeholder-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 20px;
    }

    .placeholder-content p {
      font-size: 1.2rem;
      margin: 0 0 10px 0;
    }

    .placeholder-content small {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .specs-grid,
      .peripherals-grid {
        grid-template-columns: 1fr;
      }
      
      .settings-grid {
        grid-template-columns: 1fr;
      }
      
      .spec-item,
      .peripheral-item {
        flex-direction: column;
        text-align: center;
      }
      
      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class SetupComponent {
  pcSpecs = [
    { component: 'Processeur', model: 'AMD Ryzen 7 5800X', icon: '🖥️', note: '8 cores, 3.8GHz' },
    { component: 'Carte Graphique', model: 'NVIDIA RTX 3070', icon: '🎮', note: '8GB VRAM' },
    { component: 'Mémoire', model: '32GB DDR4-3200', icon: '💾', note: 'Corsair Vengeance' },
    { component: 'Stockage', model: '1TB NVMe SSD', icon: '💿', note: 'Samsung 980 Pro' },
    { component: 'Carte Mère', model: 'ASUS ROG B550-F', icon: '🔌', note: 'ATX, PCIe 4.0' },
    { component: 'Alimentation', model: '750W 80+ Gold', icon: '⚡', note: 'Corsair RM750x' }
  ];

  peripherals = [
    { 
      name: 'Souris', 
      model: 'Logitech G Pro X Superlight', 
      icon: '🖱️',
      specs: ['25,600 DPI', 'Wireless', '63g']
    },
    { 
      name: 'Clavier', 
      model: 'Ducky One 3', 
      icon: '⌨️',
      specs: ['Cherry MX Red', 'TKL', 'PBT Keycaps']
    },
    { 
      name: 'Casque', 
      model: 'HyperX Cloud Alpha S', 
      icon: '🎧',
      specs: ['7.1 Surround', 'USB', 'Détachable Mic']
    },
    { 
      name: 'Écran', 
      model: 'ASUS ROG Swift 240Hz', 
      icon: '🖥️',
      specs: ['24"', '1080p', '1ms Response']
    },
    { 
      name: 'Tapis de Souris', 
      model: 'SteelSeries QcK+', 
      icon: '🖱️',
      specs: ['450x400mm', 'Cloth', 'Non-slip']
    },
    { 
      name: 'Micro', 
      model: 'Blue Yeti', 
      icon: '🎤',
      specs: ['USB', 'Cardioid', '48kHz']
    }
  ];

  gameSettings = [
    {
      name: 'Sensibilité',
      settings: [
        { name: 'DPI', value: '800' },
        { name: 'Sensibilité', value: '0.35' },
        { name: 'Scoped Sens', value: '0.8' }
      ]
    },
    {
      name: 'Crosshair',
      settings: [
        { name: 'Color', value: 'Cyan' },
        { name: 'Thickness', value: '1' },
        { name: 'Length', value: '4' },
        { name: 'Gap', value: '3' }
      ]
    },
    {
      name: 'Video',
      settings: [
        { name: 'Resolution', value: '1920x1080' },
        { name: 'Refresh Rate', value: '240Hz' },
        { name: 'Graphics Quality', value: 'Low' },
        { name: 'FPS Cap', value: 'Unlocked' }
      ]
    },
    {
      name: 'Audio',
      settings: [
        { name: 'Master Volume', value: '100%' },
        { name: 'SFX Volume', value: '80%' },
        { name: 'Voice Volume', value: '70%' },
        { name: 'Music Volume', value: '30%' }
      ]
    }
  ];
}
