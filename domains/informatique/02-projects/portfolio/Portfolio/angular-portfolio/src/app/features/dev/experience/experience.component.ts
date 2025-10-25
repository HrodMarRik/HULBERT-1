import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="experience-section">
      <div class="container">
        <h2>Expérience Professionnelle</h2>
        
        <div class="timeline">
          <div class="timeline-item" *ngFor="let exp of experiences; let i = index">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="experience-card">
                <div class="experience-header">
                  <h3>{{ exp.position }}</h3>
                  <span class="company">{{ exp.company }}</span>
                  <span class="period">{{ exp.period }}</span>
                </div>
                <p class="description">{{ exp.description }}</p>
                <div class="achievements">
                  <h4>Réalisations :</h4>
                  <ul>
                    <li *ngFor="let achievement of exp.achievements">{{ achievement }}</li>
                  </ul>
                </div>
                <div class="technologies">
                  <span class="tech-tag" *ngFor="let tech of exp.technologies">{{ tech }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .experience-section {
      padding: 50px 0;
      min-height: 100vh;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 20px;
    }

    h2 {
      text-align: center;
      margin-bottom: 50px;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .timeline {
      position: relative;
      padding-left: 30px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, #3498db, #1abc9c);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 40px;
    }

    .timeline-marker {
      position: absolute;
      left: -22px;
      top: 20px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3498db;
      border: 3px solid white;
      box-shadow: 0 0 0 3px #3498db;
    }

    .experience-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin-left: 20px;
    }

    .experience-header {
      margin-bottom: 20px;
    }

    .experience-header h3 {
      margin: 0 0 10px 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .company {
      display: block;
      font-size: 1.2rem;
      font-weight: 600;
      color: #3498db;
      margin-bottom: 5px;
    }

    .period {
      display: block;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .description {
      margin-bottom: 20px;
      line-height: 1.6;
      color: #555;
    }

    .achievements h4 {
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .achievements ul {
      margin: 0 0 20px 0;
      padding-left: 20px;
    }

    .achievements li {
      margin-bottom: 5px;
      color: #555;
    }

    .technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tech-tag {
      background: linear-gradient(135deg, #3498db, #1abc9c);
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
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

    :host-context(.gaming-theme) .timeline::before {
      background: linear-gradient(to bottom, #ff4655, #fd4556);
    }

    :host-context(.gaming-theme) .timeline-marker {
      background: #ff4655;
      box-shadow: 0 0 0 3px #ff4655;
    }

    :host-context(.gaming-theme) .experience-card {
      background: rgba(15, 25, 35, 0.8);
      color: white;
      border: 1px solid rgba(255, 70, 85, 0.3);
    }

    :host-context(.gaming-theme) .experience-header h3 {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .company {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .achievements h4 {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .tech-tag {
      background: linear-gradient(135deg, #ff4655, #fd4556);
    }

    @media (max-width: 768px) {
      .timeline {
        padding-left: 20px;
      }

      .timeline::before {
        left: 10px;
      }

      .timeline-marker {
        left: -17px;
      }

      .experience-card {
        margin-left: 10px;
        padding: 20px;
      }

      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class ExperienceComponent {
  experiences = [
    {
      position: 'Développeur Full Stack Senior',
      company: 'TechCorp Solutions',
      period: '2022 - Présent',
      description: 'Développement d\'applications web complexes avec Angular et Node.js. Responsable de l\'architecture technique et de la formation des développeurs juniors.',
      achievements: [
        'Augmentation de 40% des performances de l\'application principale',
        'Mise en place d\'une architecture microservices',
        'Formation de 5 développeurs juniors'
      ],
      technologies: ['Angular', 'Node.js', 'PostgreSQL', 'Docker', 'AWS']
    },
    {
      position: 'Développeur Frontend',
      company: 'WebAgency Pro',
      period: '2020 - 2022',
      description: 'Développement d\'interfaces utilisateur modernes et responsives. Collaboration étroite avec les équipes UX/UI.',
      achievements: [
        'Création de 15+ interfaces utilisateur',
        'Amélioration de l\'accessibilité web',
        'Réduction de 30% du temps de chargement'
      ],
      technologies: ['Angular', 'TypeScript', 'SCSS', 'RxJS']
    },
    {
      position: 'Développeur Junior',
      company: 'StartupTech',
      period: '2019 - 2020',
      description: 'Première expérience professionnelle dans le développement web. Participation à des projets variés et apprentissage des bonnes pratiques.',
      achievements: [
        'Développement de fonctionnalités core',
        'Participation aux code reviews',
        'Apprentissage des méthodologies Agile'
      ],
      technologies: ['JavaScript', 'HTML', 'CSS', 'React']
    }
  ];
}
