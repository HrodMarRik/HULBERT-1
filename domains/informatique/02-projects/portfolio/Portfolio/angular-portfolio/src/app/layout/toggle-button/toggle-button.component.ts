import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-toggle-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toggle-container">
      <button 
        class="theme-toggle" 
        (click)="toggleTheme()"
        [class.dev-theme]="currentTheme === 'dev'"
        [class.gaming-theme]="currentTheme === 'gaming'">
        <div class="toggle-slider">
          <div class="toggle-indicator">
            <i class="icon" [class]="currentTheme === 'dev' ? 'briefcase' : 'gamepad'"></i>
          </div>
        </div>
        <span class="toggle-label">{{ currentTheme === 'dev' ? 'Dev' : 'Gaming' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .toggle-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
      font-size: 14px;
      position: relative;
      overflow: hidden;
    }

    .toggle-slider {
      width: 40px;
      height: 20px;
      border-radius: 10px;
      position: relative;
      transition: all 0.3s ease;
    }

    .toggle-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      font-size: 10px;
      transition: all 0.3s ease;
    }

    .briefcase::before {
      content: '💼';
    }

    .gamepad::before {
      content: '🎮';
    }

    .dev-theme {
      background: linear-gradient(135deg, #3498db, #2c3e50);
      color: white;
    }

    .dev-theme .toggle-slider {
      background: rgba(255, 255, 255, 0.3);
    }

    .dev-theme .toggle-indicator {
      background: white;
      left: 2px;
    }

    .gaming-theme {
      background: linear-gradient(135deg, #ff4655, #0f1923);
      color: white;
    }

    .gaming-theme .toggle-slider {
      background: rgba(255, 255, 255, 0.3);
    }

    .gaming-theme .toggle-indicator {
      background: white;
      left: 22px;
    }

    .toggle-label {
      font-family: 'Arial', sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @media (max-width: 768px) {
      .toggle-container {
        top: 15px;
        right: 15px;
      }
      
      .theme-toggle {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .toggle-slider {
        width: 35px;
        height: 18px;
      }
      
      .toggle-indicator {
        width: 14px;
        height: 14px;
      }
      
      .gaming-theme .toggle-indicator {
        left: 19px;
      }
    }
  `]
})
export class ToggleButtonComponent {
  currentTheme: Theme = 'dev';

  constructor(private themeService: ThemeService) {
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
