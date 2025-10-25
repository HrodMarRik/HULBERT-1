import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-email-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="email-campaigns">
      <div class="page-header">
        <h1>Email Campaigns</h1>
        <p>Gérez vos campagnes email</p>
      </div>
      
      <div class="content">
        <div class="placeholder">
          <h2>Composant Email Campaigns</h2>
          <p>Ce composant sera implémenté prochainement.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-campaigns {
      padding: 20px;
    }
    
    .page-header {
      margin-bottom: 30px;
    }
    
    .page-header h1 {
      font-size: 2rem;
      margin: 0 0 10px 0;
    }
    
    .placeholder {
      text-align: center;
      padding: 60px 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .placeholder h2 {
      color: #666;
      margin-bottom: 10px;
    }
    
    .placeholder p {
      color: #999;
    }
  `]
})
export class EmailCampaignsComponent implements OnInit {
  ngOnInit() {
    // Implementation will be added later
  }
}
