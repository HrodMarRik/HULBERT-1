import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="cv-section">
      <div class="container">
        <h2>Curriculum Vitae</h2>
        
        <div class="cv-content">
          <div class="personal-info">
            <div class="profile-card">
              <div class="avatar">
                <div class="avatar-placeholder">👨‍💻</div>
              </div>
              <h3>John Developer</h3>
              <p class="title">Full Stack Developer</p>
              <p class="location">📍 Paris, France</p>
            </div>
          </div>

          <div class="skills-section">
            <h3>Compétences Techniques</h3>
            <div class="skills-grid">
              <div class="skill-item" *ngFor="let skill of skills">
                <div class="skill-header">
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-level">{{ skill.level }}%</span>
                </div>
                <div class="skill-bar">
                  <div class="skill-progress" [style.width.%]="skill.level"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="education-section">
            <h3>Formation</h3>
            <div class="education-item" *ngFor="let edu of education">
              <div class="education-card">
                <h4>{{ edu.degree }}</h4>
                <p class="institution">{{ edu.institution }}</p>
                <p class="period">{{ edu.period }}</p>
                <p class="description">{{ edu.description }}</p>
              </div>
            </div>
          </div>

          <div class="certifications-section">
            <h3>Certifications</h3>
            <div class="cert-grid">
              <div class="cert-item" *ngFor="let cert of certifications">
                <div class="cert-card">
                  <div class="cert-icon">{{ cert.icon }}</div>
                  <h4>{{ cert.name }}</h4>
                  <p>{{ cert.issuer }}</p>
                  <span class="cert-date">{{ cert.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cv-section {
      padding: 100px 0 50px;
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

    .cv-content {
      display: grid;
      gap: 40px;
    }

    .personal-info {
      text-align: center;
    }

    .profile-card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      max-width: 400px;
      margin: 0 auto;
    }

    .avatar {
      margin-bottom: 20px;
    }

    .avatar-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3498db, #2c3e50);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      margin: 0 auto;
    }

    .skills-section h3,
    .education-section h3,
    .certifications-section h3 {
      font-size: 1.8rem;
      margin-bottom: 30px;
      text-align: center;
    }

    .skills-grid {
      display: grid;
      gap: 20px;
    }

    .skill-item {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .skill-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .skill-bar {
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .skill-progress {
      height: 100%;
      background: linear-gradient(90deg, #3498db, #1abc9c);
      transition: width 1s ease;
    }

    .education-item {
      margin-bottom: 20px;
    }

    .education-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .cert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .cert-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      text-align: center;
    }

    .cert-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    :host-context(.dev-theme) {
      color: #2c3e50;
    }

    :host-context(.dev-theme) h2,
    :host-context(.dev-theme) h3,
    :host-context(.dev-theme) h4 {
      color: #2c3e50;
    }

    :host-context(.gaming-theme) {
      color: white;
    }

    :host-context(.gaming-theme) h2,
    :host-context(.gaming-theme) h3,
    :host-context(.gaming-theme) h4 {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .profile-card,
    :host-context(.gaming-theme) .skill-item,
    :host-context(.gaming-theme) .education-card,
    :host-context(.gaming-theme) .cert-card {
      background: rgba(15, 25, 35, 0.8);
      color: white;
      border: 1px solid rgba(255, 70, 85, 0.3);
    }

    :host-context(.gaming-theme) .skill-progress {
      background: linear-gradient(90deg, #ff4655, #fd4556);
    }

    @media (max-width: 768px) {
      .cv-section {
        padding: 80px 0 30px;
      }
      
      h2 {
        font-size: 2rem;
        margin-bottom: 30px;
      }
      
      .profile-card {
        padding: 20px;
      }
      
      .avatar-placeholder {
        width: 80px;
        height: 80px;
        font-size: 2.5rem;
      }
    }
  `]
})
export class CvComponent {
  skills = [
    { name: 'Angular', level: 90 },
    { name: 'TypeScript', level: 85 },
    { name: 'Node.js', level: 80 },
    { name: 'Python', level: 75 },
    { name: 'PostgreSQL', level: 70 },
    { name: 'Docker', level: 65 }
  ];

  education = [
    {
      degree: 'Master en Informatique',
      institution: 'Université de Paris',
      period: '2020-2022',
      description: 'Spécialisation en développement web et architecture logicielle'
    },
    {
      degree: 'Licence Informatique',
      institution: 'Université de Paris',
      period: '2017-2020',
      description: 'Formation générale en informatique et programmation'
    }
  ];

  certifications = [
    { name: 'AWS Certified Developer', issuer: 'Amazon Web Services', date: '2023', icon: '☁️' },
    { name: 'Angular Certified', issuer: 'Google', date: '2023', icon: '🅰️' },
    { name: 'Docker Certified', issuer: 'Docker Inc.', date: '2022', icon: '🐳' }
  ];
}
