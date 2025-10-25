import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-gaming',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact-gaming-section">
      <div class="container">
        <h2>Contact Gaming</h2>
        
        <div class="contact-content">
          <div class="gaming-info">
            <h3>Informations Gaming</h3>
            <div class="info-item">
              <span class="info-icon">🎮</span>
              <div class="info-content">
                <h4>Nom de Jeu</h4>
                <p>ValorantPro#EUW</p>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">🏆</span>
              <div class="info-content">
                <h4>Rang Actuel</h4>
                <p>Immortal 3 - 2450 RR</p>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">👥</span>
              <div class="info-content">
                <h4>Équipe</h4>
                <p>Team Phoenix</p>
              </div>
            </div>
            
            <div class="gaming-social">
              <h4>Réseaux Gaming</h4>
              <div class="social-grid">
                <a href="https://discord.gg/valorantpro" target="_blank" class="social-link">
                  <span class="social-icon">💬</span>
                  <span>Discord</span>
                </a>
                <a href="https://twitch.tv/valorantpro" target="_blank" class="social-link">
                  <span class="social-icon">📺</span>
                  <span>Twitch</span>
                </a>
                <a href="https://twitter.com/valorantpro" target="_blank" class="social-link">
                  <span class="social-icon">🐦</span>
                  <span>Twitter</span>
                </a>
                <a href="https://youtube.com/valorantpro" target="_blank" class="social-link">
                  <span class="social-icon">📹</span>
                  <span>YouTube</span>
                </a>
              </div>
            </div>

            <div class="coaching-info">
              <h4>Coaching Disponible</h4>
              <div class="coaching-options">
                <div class="coaching-item">
                  <h5>Session Individuelle</h5>
                  <p>Analyse de gameplay personnalisée</p>
                  <span class="price">50€/h</span>
                </div>
                <div class="coaching-item">
                  <h5>Session Groupe</h5>
                  <p>Coaching d'équipe et stratégies</p>
                  <span class="price">100€/h</span>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-form">
            <h3>Contactez-moi pour Gaming</h3>
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
                <select 
                  id="subject" 
                  name="subject" 
                  [(ngModel)]="formData.subject"
                  class="form-input">
                  <option value="">Sélectionnez un sujet</option>
                  <option value="coaching">Coaching Valorant</option>
                  <option value="team">Recrutement Équipe</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="tournament">Tournoi</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="rank">Votre Rang Valorant</label>
                <select 
                  id="rank" 
                  name="rank" 
                  [(ngModel)]="formData.rank"
                  class="form-input">
                  <option value="">Sélectionnez votre rang</option>
                  <option value="iron">Iron</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                  <option value="ascendant">Ascendant</option>
                  <option value="immortal">Immortal</option>
                  <option value="radiant">Radiant</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="message">Message *</label>
                <textarea 
                  id="message" 
                  name="message" 
                  [(ngModel)]="formData.message"
                  required
                  rows="5"
                  class="form-input"
                  placeholder="Décrivez votre demande..."></textarea>
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
    .contact-gaming-section {
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

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
    }

    .gaming-info h3,
    .contact-form h3 {
      margin-bottom: 30px;
      font-size: 1.8rem;
      color: #ff4655;
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
      color: white;
    }

    .info-content p {
      margin: 0;
      color: #ff4655;
      font-weight: 600;
    }

    .gaming-social {
      margin-top: 40px;
    }

    .gaming-social h4 {
      margin-bottom: 20px;
      font-size: 1.2rem;
      color: white;
    }

    .social-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .social-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 15px;
      background: rgba(255, 70, 85, 0.2);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      transition: all 0.3s ease;
      font-weight: 500;
      border: 1px solid rgba(255, 70, 85, 0.3);
    }

    .social-link:hover {
      background: #ff4655;
      transform: translateY(-2px);
    }

    .coaching-info {
      margin-top: 40px;
    }

    .coaching-info h4 {
      margin-bottom: 20px;
      font-size: 1.2rem;
      color: white;
    }

    .coaching-options {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .coaching-item {
      background: rgba(255, 70, 85, 0.1);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 10px;
      padding: 20px;
    }

    .coaching-item h5 {
      margin: 0 0 10px 0;
      color: #ff4655;
      font-size: 1.1rem;
    }

    .coaching-item p {
      margin: 0 0 10px 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .price {
      color: #ff4655;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .form-group {
      margin-bottom: 25px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: white;
    }

    .form-input {
      width: 100%;
      padding: 12px 15px;
      background: rgba(15, 25, 35, 0.5);
      border: 2px solid rgba(255, 70, 85, 0.3);
      border-radius: 8px;
      font-size: 1rem;
      color: white;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #ff4655;
    }

    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .submit-btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #ff4655, #fd4556);
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
      box-shadow: 0 5px 15px rgba(255, 70, 85, 0.3);
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
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
      border: 1px solid rgba(39, 174, 96, 0.3);
    }

    .form-status .error {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
      border: 1px solid rgba(231, 76, 60, 0.3);
    }

    @media (max-width: 768px) {
      .contact-content {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .social-grid {
        grid-template-columns: 1fr;
      }
      
      .coaching-options {
        gap: 10px;
      }
      
      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class ContactGamingComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    rank: '',
    message: ''
  };

  formStatus: { type: string; message: string } | null = null;

  onSubmit() {
    // Simulate form submission
    this.formStatus = {
      type: 'success',
      message: 'Message envoyé avec succès ! Je vous répondrai rapidement pour discuter de votre demande gaming.'
    };
    
    // Reset form
    this.formData = {
      name: '',
      email: '',
      subject: '',
      rank: '',
      message: ''
    };
    
    // Clear status after 5 seconds
    setTimeout(() => {
      this.formStatus = null;
    }, 5000);
  }
}
