import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { NavigationComponent } from './layout/components/navigation/navigation.component';
import { FooterComponent } from './layout/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, NavigationComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navigation></app-navigation>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .main-content {
      flex: 1;
      padding: 2rem 0;
    }
  `]
})
export class AppComponent {}