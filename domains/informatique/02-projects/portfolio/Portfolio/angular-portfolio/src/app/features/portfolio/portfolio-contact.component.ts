import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PortfolioService, CreateContactRequest } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="portfolio-contact">
      <!-- Hero Section -->
      <section class="contact-hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="gradient-text">Contactez-moi</span>
            </h1>
            <p class="hero-subtitle">
              Discutons de votre projet et créons ensemble quelque chose d'extraordinaire
            </p>
          </div>
        </div>
      </section>

      <!-- Contact Content -->
      <section class="contact-content">
        <div class="container">
          <div class="content-grid">
            <!-- Contact Form -->
            <div class="contact-form-section">
              <div class="form-card">
                <h2>Envoyez-moi un message</h2>
                <p class="form-description">
                  Remplissez le formulaire ci-dessous et je vous répondrai dans les plus brefs délais.
                </p>
                
                <form (ngSubmit)="onSubmit()" #contactForm="ngForm" class="contact-form">
                  <div class="form-group">
                    <label for="name">Nom complet *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      [(ngModel)]="contactFormData.name" 
                      required 
                      class="form-input"
                      placeholder="Votre nom complet">
                  </div>

                  <div class="form-group">
                    <label for="email">Email *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      [(ngModel)]="contactFormData.email" 
                      required 
                      email
                      class="form-input"
                      placeholder="votre@email.com">
                  </div>

                  <div class="form-group">
                    <label for="subject">Sujet *</label>
                    <input 
                      type="text" 
                      id="subject" 
                      name="subject" 
                      [(ngModel)]="contactFormData.subject" 
                      required 
                      class="form-input"
                      placeholder="Sujet de votre message">
                  </div>

                  <div class="form-group">
                    <label for="message">Message *</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      [(ngModel)]="contactFormData.message" 
                      required 
                      rows="6"
                      class="form-textarea"
                      placeholder="Décrivez votre projet ou votre demande..."></textarea>
                  </div>

                  <div class="form-actions">
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-large"
                      [disabled]="!contactForm.form.valid || isSubmitting">
                      <span class="btn-icon" *ngIf="!isSubmitting">📧</span>
                      <span class="btn-icon" *ngIf="isSubmitting">⏳</span>
                      {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer le message' }}
                    </button>
                  </div>
                </form>

                <!-- Success Message -->
                <div class="success-message" *ngIf="showSuccess">
                  <div class="success-icon">✅</div>
                  <h3>Message envoyé avec succès !</h3>
                  <p>Merci pour votre message. Je vous répondrai dans les plus brefs délais.</p>
                </div>

                <!-- Error Message -->
                <div class="error-message" *ngIf="showError">
                  <div class="error-icon">❌</div>
                  <h3>Erreur lors de l'envoi</h3>
                  <p>{{ errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Contact Info -->
            <div class="contact-info-section">
              <!-- Contact Details -->
              <div class="info-card">
                <h3>Informations de contact</h3>
                <div class="contact-details">
                  <div class="contact-item">
                    <div class="contact-icon">📧</div>
                    <div class="contact-info">
                      <div class="contact-label">Email</div>
                      <div class="contact-value">contact@votredev.com</div>
                    </div>
                  </div>
                  <div class="contact-item">
                    <div class="contact-icon">🌐</div>
                    <div class="contact-info">
                      <div class="contact-label">Site web</div>
                      <div class="contact-value">www.votredev.com</div>
                    </div>
                  </div>
                  <div class="contact-item">
                    <div class="contact-icon">📍</div>
                    <div class="contact-info">
                      <div class="contact-label">Localisation</div>
                      <div class="contact-value">France</div>
                    </div>
                  </div>
                  <div class="contact-item">
                    <div class="contact-icon">⏰</div>
                    <div class="contact-info">
                      <div class="contact-label">Disponibilité</div>
                      <div class="contact-value">Lun-Ven, 9h-18h</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Response Time -->
              <div class="response-card">
                <h3>Temps de réponse</h3>
                <div class="response-times">
                  <div class="response-item">
                    <div class="response-icon">⚡</div>
                    <div class="response-info">
                      <div class="response-label">Réponse rapide</div>
                      <div class="response-value">Sous 24h</div>
                    </div>
                  </div>
                  <div class="response-item">
                    <div class="response-icon">📋</div>
                    <div class="response-info">
                      <div class="response-label">Devis détaillé</div>
                      <div class="response-value">Sous 48h</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Social Links -->
              <div class="social-card">
                <h3>Suivez-moi</h3>
                <div class="social-links">
                  <a href="#" class="social-link">
                    <span class="social-icon">💼</span>
                    <span class="social-text">LinkedIn</span>
                  </a>
                  <a href="#" class="social-link">
                    <span class="social-icon">📁</span>
                    <span class="social-text">GitHub</span>
                  </a>
                  <a href="#" class="social-link">
                    <span class="social-icon">🐦</span>
                    <span class="social-text">Twitter</span>
                  </a>
                  <a href="#" class="social-link">
                    <span class="social-icon">📸</span>
                    <span class="social-text">Instagram</span>
                  </a>
                </div>
              </div>

              <!-- FAQ -->
              <div class="faq-card">
                <h3>Questions fréquentes</h3>
                <div class="faq-list">
                  <div class="faq-item">
                    <div class="faq-question">Quel est votre délai de livraison ?</div>
                    <div class="faq-answer">Cela dépend de la complexité du projet, généralement entre 2-8 semaines.</div>
                  </div>
                  <div class="faq-item">
                    <div class="faq-question">Proposez-vous un support après livraison ?</div>
                    <div class="faq-answer">Oui, je propose 30 jours de support gratuit après la livraison.</div>
                  </div>
                  <div class="faq-item">
                    <div class="faq-question">Travaillez-vous avec des équipes ?</div>
                    <div class="faq-answer">Absolument, je collabore régulièrement avec des designers et autres développeurs.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">Prêt à commencer ?</h2>
            <p class="cta-description">
              Découvrez mes projets et compétences pour mieux comprendre mon approche.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/projects" class="btn btn-primary btn-large">
                <span class="btn-icon">🚀</span>
                Voir mes projets
              </a>
              <a routerLink="/portfolio/about" class="btn btn-secondary btn-large">
                <span class="btn-icon">👨‍💻</span>
                En savoir plus
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .portfolio-contact {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Hero Section */
    .contact-hero {
      padding: 100px 0 60px;
      text-align: center;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.3rem;
      color: #94a3b8;
    }

    /* Contact Content */
    .contact-content {
      padding: 80px 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 60px;
    }

    /* Contact Form */
    .form-card {
      background: #1e293b;
      padding: 40px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .form-card h2 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .form-description {
      color: #94a3b8;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #f1f5f9;
    }

    .form-input,
    .form-textarea {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #475569;
      background: #0f172a;
      color: #f1f5f9;
      font-size: 16px;
      transition: all 0.2s ease;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .form-actions {
      margin-top: 20px;
    }

    /* Success/Error Messages */
    .success-message,
    .error-message {
      margin-top: 30px;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .success-message {
      background: #064e3b;
      border: 1px solid #10b981;
    }

    .error-message {
      background: #7f1d1d;
      border: 1px solid #ef4444;
    }

    .success-icon,
    .error-icon {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    .success-message h3 {
      color: #10b981;
      margin-bottom: 8px;
    }

    .error-message h3 {
      color: #ef4444;
      margin-bottom: 8px;
    }

    .success-message p,
    .error-message p {
      color: #cbd5e1;
    }

    /* Contact Info */
    .contact-info-section {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .info-card,
    .response-card,
    .social-card,
    .faq-card {
      background: #1e293b;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .info-card h3,
    .response-card h3,
    .social-card h3,
    .faq-card h3 {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f1f5f9;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .contact-icon {
      font-size: 1.5rem;
      width: 40px;
      text-align: center;
    }

    .contact-label {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .contact-value {
      font-weight: 500;
      color: #f1f5f9;
    }

    .response-times {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .response-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .response-icon {
      font-size: 1.3rem;
      width: 40px;
      text-align: center;
    }

    .response-label {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .response-value {
      font-weight: 600;
      color: #60a5fa;
    }

    .social-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .social-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #334155;
      border-radius: 8px;
      color: #f1f5f9;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .social-link:hover {
      background: #475569;
      transform: translateX(4px);
    }

    .social-icon {
      font-size: 1.2em;
    }

    .social-text {
      font-weight: 500;
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .faq-item {
      padding-bottom: 20px;
      border-bottom: 1px solid #334155;
    }

    .faq-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .faq-question {
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .faq-answer {
      color: #94a3b8;
      line-height: 1.6;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(135deg, #1e293b, #334155);
      text-align: center;
      padding: 80px 0;
    }

    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
    }

    .cta-description {
      font-size: 1.2rem;
      color: #94a3b8;
      margin-bottom: 40px;
    }

    .cta-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      color: #60a5fa;
      border: 2px solid #60a5fa;
    }

    .btn-secondary:hover {
      background: #60a5fa;
      color: white;
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 1.1rem;
    }

    .btn-icon {
      font-size: 1.2em;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .form-card {
        padding: 30px 20px;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class PortfolioContactComponent implements OnInit {
  contactFormData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  showSuccess = false;
  showError = false;
  errorMessage = '';

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    // Initialize component
  }

  onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.showSuccess = false;
    this.showError = false;

    const contactData: CreateContactRequest = {
      name: this.contactFormData.name,
      email: this.contactFormData.email,
      subject: this.contactFormData.subject,
      message: this.contactFormData.message
    };

    this.portfolioService.createContact(contactData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.showSuccess = true;
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showError = true;
        this.errorMessage = error.error?.detail || 'Une erreur est survenue lors de l\'envoi du message.';
      }
    });
  }

  resetForm() {
    this.contactFormData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
  }
}
