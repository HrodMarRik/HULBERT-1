import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact-section">
      <div class="container">
        <h2>Contact</h2>
        
        <div class="contact-content">
          <div class="contact-info">
            <h3>Informations de Contact</h3>
            <div class="info-item">
              <span class="info-icon">📧</span>
              <div class="info-content">
                <h4>Email</h4>
                <p>john.developer@email.com</p>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">📱</span>
              <div class="info-content">
                <h4>Téléphone</h4>
                <p>+33 6 12 34 56 78</p>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">📍</span>
              <div class="info-content">
                <h4>Localisation</h4>
                <p>Paris, France</p>
              </div>
            </div>
            
            <div class="social-links">
              <h4>Réseaux Sociaux</h4>
              <div class="social-grid">
                <a href="https://github.com/johndeveloper" target="_blank" class="social-link">
                  <span class="social-icon">🐙</span>
                  <span>GitHub</span>
                </a>
                <a href="https://linkedin.com/in/johndeveloper" target="_blank" class="social-link">
                  <span class="social-icon">💼</span>
                  <span>LinkedIn</span>
                </a>
                <a href="https://twitter.com/johndeveloper" target="_blank" class="social-link">
                  <span class="social-icon">🐦</span>
                  <span>Twitter</span>
                </a>
              </div>
            </div>
          </div>

          <div class="contact-form">
            <h3>Envoyez-moi un message</h3>
            <form (ngSubmit)="onSubmit()" #contactForm="ngForm">
              <div class="form-group">
                <label for="name">Nom *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="formData.name"
                  required
                  class="form-input">
              </div>
              
              <div class="form-group">
                <label for="email">Email *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="formData.email"
                  required
                  class="form-input">
              </div>
              
              <div class="form-group">
                <label for="subject">Sujet</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  [(ngModel)]="formData.subject"
                  class="form-input">
              </div>
              
              <div class="form-group">
                <label for="message">Message *</label>
                <textarea 
                  id="message" 
                  name="message" 
                  [(ngModel)]="formData.message"
                  required
                  rows="5"
                  class="form-input"></textarea>
              </div>
              
              <button 
                type="submit" 
                class="submit-btn"
                [disabled]="!contactForm.form.valid">
                Envoyer le message
              </button>
            </form>
            
            <div class="form-status" *ngIf="formStatus">
              <p [class]="formStatus.type">{{ formStatus.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .contact-section {
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
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
    }

    .contact-info h3,
    .contact-form h3 {
      margin-bottom: 30px;
      font-size: 1.8rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
    }

    .info-icon {
      font-size: 1.5rem;
      width: 40px;
      text-align: center;
    }

    .info-content h4 {
      margin: 0 0 5px 0;
      font-size: 1.1rem;
    }

    .info-content p {
      margin: 0;
      color: #666;
    }

    .social-links {
      margin-top: 40px;
    }

    .social-links h4 {
      margin-bottom: 20px;
      font-size: 1.2rem;
    }

    .social-grid {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .social-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      background: #ecf0f1;
      color: #2c3e50;
      text-decoration: none;
      border-radius: 25px;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .social-link:hover {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
    }

    .form-group {
      margin-bottom: 25px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #3498db;
    }

    .submit-btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #3498db, #1abc9c);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .form-status .success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .form-status .error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    :host-context(.dev-theme) {
      color: #2c3e50;
    }

    :host-context(.dev-theme) h2 {
      color: #2c3e50;
    }

    :host-context(.gaming-theme) {
      color: white;
    }

    :host-context(.gaming-theme) h2 {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .contact-info,
    :host-context(.gaming-theme) .contact-form {
      background: rgba(15, 25, 35, 0.8);
      padding: 30px;
      border-radius: 15px;
      border: 1px solid rgba(255, 70, 85, 0.3);
    }

    :host-context(.gaming-theme) .contact-info h3,
    :host-context(.gaming-theme) .contact-form h3 {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .info-content h4,
    :host-context(.gaming-theme) .form-group label {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .social-link {
      background: rgba(255, 70, 85, 0.2);
      color: white;
    }

    :host-context(.gaming-theme) .social-link:hover {
      background: #ff4655;
    }

    :host-context(.gaming-theme) .form-input {
      background: rgba(15, 25, 35, 0.5);
      border-color: rgba(255, 70, 85, 0.3);
      color: white;
    }

    :host-context(.gaming-theme) .form-input:focus {
      border-color: #ff4655;
    }

    :host-context(.gaming-theme) .submit-btn {
      background: linear-gradient(135deg, #ff4655, #fd4556);
    }

    :host-context(.gaming-theme) .submit-btn:hover:not(:disabled) {
      box-shadow: 0 5px 15px rgba(255, 70, 85, 0.3);
    }

    @media (max-width: 768px) {
      .contact-content {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .social-grid {
        justify-content: center;
      }
      
      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  formStatus: { type: string; message: string } | null = null;

  onSubmit() {
    // Simulate form submission
    this.formStatus = {
      type: 'success',
      message: 'Message envoyé avec succès ! Je vous répondrai dans les plus brefs délais.'
    };
    
    // Reset form
    this.formData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
    
    // Clear status after 5 seconds
    setTimeout(() => {
      this.formStatus = null;
    }, 5000);
  }
}
