import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortfolioService, PortfolioSkill, PortfolioTestimonial } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="portfolio-about">
      <!-- Hero Section -->
      <section class="about-hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                <span class="gradient-text">À propos de moi</span>
              </h1>
              <p class="hero-subtitle">
                Développeur passionné, créateur d'expériences digitales
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- About Content -->
      <section class="about-content">
        <div class="container">
          <div class="content-grid">
            <div class="about-text">
              <div class="text-section">
                <h2>Mon parcours</h2>
                <p>
                  Passionné par la technologie depuis mon plus jeune âge, j'ai commencé ma carrière 
                  dans le développement web il y a plusieurs années. Mon expertise s'est construite 
                  autour des technologies modernes du web, avec une prédilection pour les frameworks 
                  JavaScript et les architectures robustes.
                </p>
                <p>
                  Aujourd'hui, je me spécialise dans le développement full-stack avec Angular et FastAPI, 
                  créant des applications web performantes et évolutives. Mon approche se base sur 
                  l'écoute des besoins clients et la recherche constante de solutions innovantes.
                </p>
              </div>

              <div class="text-section">
                <h2>Ma philosophie</h2>
                <p>
                  Je crois que la technologie doit servir l'humain. Chaque projet que je développe 
                  est pensé pour offrir une expérience utilisateur exceptionnelle tout en répondant 
                  aux besoins métier spécifiques.
                </p>
                <p>
                  La qualité du code, la maintenabilité et la performance sont au cœur de ma démarche. 
                  Je privilégie toujours les solutions éprouvées et les bonnes pratiques de développement.
                </p>
              </div>

              <div class="text-section">
                <h2>Mes valeurs</h2>
                <div class="values-grid">
                  <div class="value-item">
                    <div class="value-icon">🎯</div>
                    <h3>Excellence</h3>
                    <p>Recherche constante de la qualité et de l'amélioration continue</p>
                  </div>
                  <div class="value-item">
                    <div class="value-icon">🤝</div>
                    <h3>Collaboration</h3>
                    <p>Travail en équipe et communication transparente avec les clients</p>
                  </div>
                  <div class="value-item">
                    <div class="value-icon">🚀</div>
                    <h3>Innovation</h3>
                    <p>Adoption des technologies émergentes et solutions créatives</p>
                  </div>
                  <div class="value-item">
                    <div class="value-icon">⏰</div>
                    <h3>Ponctualité</h3>
                    <p>Respect des délais et livraisons dans les temps</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="about-sidebar">
              <!-- Profile Card -->
              <div class="profile-card">
                <div class="profile-image">
                  <div class="avatar-placeholder">
                    <span class="avatar-icon">👨‍💻</span>
                  </div>
                </div>
                <div class="profile-info">
                  <h3>Votre Développeur</h3>
                  <p class="profile-title">Développeur Full-Stack</p>
                  <p class="profile-location">📍 France</p>
                </div>
                <div class="profile-stats">
                  <div class="stat">
                    <span class="stat-number">{{ totalProjects }}</span>
                    <span class="stat-label">Projets réalisés</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">{{ totalSkills }}</span>
                    <span class="stat-label">Compétences</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">{{ totalTestimonials }}</span>
                    <span class="stat-label">Témoignages</span>
                  </div>
                </div>
                <div class="profile-actions">
                  <a routerLink="/portfolio/contact" class="btn btn-primary">
                    <span class="btn-icon">💬</span>
                    Me contacter
                  </a>
                  <a href="/cv.pdf" class="btn btn-secondary" target="_blank">
                    <span class="btn-icon">📄</span>
                    Télécharger CV
                  </a>
                </div>
              </div>

              <!-- Skills Overview -->
              <div class="skills-card" *ngIf="skills.length > 0">
                <h3>Compétences principales</h3>
                <div class="skills-list">
                  <div class="skill-item" *ngFor="let skill of topSkills">
                    <div class="skill-info">
                      <span class="skill-icon" *ngIf="skill.icon">{{ skill.icon }}</span>
                      <span class="skill-name">{{ skill.name }}</span>
                    </div>
                    <div class="skill-level">
                      <div class="level-bar">
                        <div class="level-fill" [style.width.%]="(skill.level / 5) * 100"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <a routerLink="/portfolio/skills" class="view-all-skills">
                  Voir toutes les compétences →
                </a>
              </div>

              <!-- Testimonials Preview -->
              <div class="testimonials-card" *ngIf="featuredTestimonials.length > 0">
                <h3>Témoignages clients</h3>
                <div class="testimonial-preview" *ngFor="let testimonial of featuredTestimonials.slice(0, 2)">
                  <div class="testimonial-rating" *ngIf="testimonial.rating">
                    <span class="star" *ngFor="let star of getStars(testimonial.rating)">⭐</span>
                  </div>
                  <blockquote class="testimonial-text">"{{ testimonial.content }}"</blockquote>
                  <div class="testimonial-author">
                    <strong>{{ testimonial.author }}</strong>
                    <span *ngIf="testimonial.company">, {{ testimonial.company }}</span>
                  </div>
                </div>
                <a routerLink="/portfolio/testimonials" class="view-all-testimonials">
                  Voir tous les témoignages →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Experience Timeline -->
      <section class="experience-timeline">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Mon expérience</h2>
            <p class="section-subtitle">Parcours professionnel et réalisations</p>
          </div>
          <div class="timeline">
            <div class="timeline-item" *ngFor="let experience of experiences">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-period">{{ experience.period }}</div>
                <h3 class="timeline-title">{{ experience.title }}</h3>
                <p class="timeline-company">{{ experience.company }}</p>
                <p class="timeline-description">{{ experience.description }}</p>
                <div class="timeline-technologies" *ngIf="experience.technologies">
                  <span class="tech-tag" *ngFor="let tech of experience.technologies">
                    {{ tech }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Education -->
      <section class="education">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Formation</h2>
            <p class="section-subtitle">Parcours académique et certifications</p>
          </div>
          <div class="education-grid">
            <div class="education-item" *ngFor="let education of educations">
              <div class="education-icon">
                <span class="icon">🎓</span>
              </div>
              <div class="education-content">
                <div class="education-period">{{ education.period }}</div>
                <h3 class="education-title">{{ education.title }}</h3>
                <p class="education-institution">{{ education.institution }}</p>
                <p class="education-description">{{ education.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">Prêt à travailler ensemble ?</h2>
            <p class="cta-description">
              Discutons de votre projet et créons quelque chose d'extraordinaire.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/contact" class="btn btn-primary btn-large">
                <span class="btn-icon">💬</span>
                Commencer un projet
              </a>
              <a routerLink="/portfolio/projects" class="btn btn-secondary btn-large">
                <span class="btn-icon">🚀</span>
                Voir mes projets
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .portfolio-about {
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
    .about-hero {
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

    /* About Content */
    .about-content {
      padding: 60px 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 60px;
    }

    .about-text {
      font-size: 1.1rem;
      line-height: 1.7;
    }

    .text-section {
      margin-bottom: 40px;
    }

    .text-section h2 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #60a5fa;
    }

    .text-section p {
      margin-bottom: 16px;
      color: #cbd5e1;
    }

    /* Values Grid */
    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .value-item {
      text-align: center;
      padding: 24px;
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .value-icon {
      font-size: 2.5rem;
      margin-bottom: 16px;
    }

    .value-item h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .value-item p {
      color: #94a3b8;
      font-size: 0.95rem;
    }

    /* Sidebar */
    .about-sidebar {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .profile-card,
    .skills-card,
    .testimonials-card {
      background: #1e293b;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .profile-image {
      text-align: center;
      margin-bottom: 20px;
    }

    .avatar-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .avatar-icon {
      font-size: 3rem;
    }

    .profile-info {
      text-align: center;
      margin-bottom: 24px;
    }

    .profile-info h3 {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f1f5f9;
    }

    .profile-title {
      color: #60a5fa;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .profile-location {
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #60a5fa;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .profile-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Skills Card */
    .skills-card h3,
    .testimonials-card h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f1f5f9;
    }

    .skills-list {
      margin-bottom: 16px;
    }

    .skill-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .skill-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .skill-icon {
      font-size: 1.1em;
    }

    .skill-name {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .skill-level {
      width: 60px;
    }

    .level-bar {
      width: 100%;
      height: 4px;
      background: #334155;
      border-radius: 2px;
      overflow: hidden;
    }

    .level-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      transition: width 0.3s ease;
    }

    .view-all-skills,
    .view-all-testimonials {
      color: #60a5fa;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .view-all-skills:hover,
    .view-all-testimonials:hover {
      color: #93c5fd;
    }

    /* Testimonials Card */
    .testimonial-preview {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #334155;
    }

    .testimonial-preview:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .testimonial-rating {
      margin-bottom: 8px;
    }

    .star {
      font-size: 0.9em;
    }

    .testimonial-text {
      font-style: italic;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 12px;
      color: #cbd5e1;
    }

    .testimonial-author {
      font-size: 0.85rem;
      color: #94a3b8;
    }

    /* Experience Timeline */
    .experience-timeline {
      padding: 80px 0;
      background: #1e293b;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
    }

    .section-subtitle {
      font-size: 1.2rem;
      color: #94a3b8;
    }

    .timeline {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 30px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #334155;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 40px;
      padding-left: 80px;
    }

    .timeline-marker {
      position: absolute;
      left: 20px;
      top: 8px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #60a5fa;
      border: 4px solid #1e293b;
    }

    .timeline-content {
      background: #0f172a;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .timeline-period {
      color: #60a5fa;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .timeline-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f1f5f9;
    }

    .timeline-company {
      color: #94a3b8;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .timeline-description {
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .timeline-technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tech-tag {
      background: #334155;
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    /* Education */
    .education {
      padding: 80px 0;
    }

    .education-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .education-item {
      display: flex;
      gap: 20px;
      background: #1e293b;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .education-icon {
      flex-shrink: 0;
    }

    .icon {
      font-size: 2.5rem;
    }

    .education-content {
      flex: 1;
    }

    .education-period {
      color: #60a5fa;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .education-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f1f5f9;
    }

    .education-institution {
      color: #94a3b8;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .education-description {
      color: #cbd5e1;
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

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
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

      .values-grid {
        grid-template-columns: 1fr;
      }

      .profile-stats {
        grid-template-columns: 1fr;
      }

      .timeline::before {
        left: 15px;
      }

      .timeline-item {
        padding-left: 50px;
      }

      .timeline-marker {
        left: 5px;
      }

      .education-item {
        flex-direction: column;
        text-align: center;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class PortfolioAboutComponent implements OnInit {
  skills: PortfolioSkill[] = [];
  featuredTestimonials: PortfolioTestimonial[] = [];
  topSkills: PortfolioSkill[] = [];
  totalProjects = 0;
  totalSkills = 0;
  totalTestimonials = 0;

  experiences = [
    {
      period: "2023 - Présent",
      title: "Développeur Full-Stack Freelance",
      company: "Indépendant",
      description: "Développement d'applications web complètes avec Angular et FastAPI. Gestion de projets clients de A à Z.",
      technologies: ["Angular", "FastAPI", "PostgreSQL", "Docker"]
    },
    {
      period: "2021 - 2023",
      title: "Développeur Frontend Senior",
      company: "Tech Company",
      description: "Développement d'interfaces utilisateur complexes avec Angular. Collaboration avec les équipes backend et design.",
      technologies: ["Angular", "TypeScript", "RxJS", "SCSS"]
    },
    {
      period: "2019 - 2021",
      title: "Développeur Web",
      company: "Digital Agency",
      description: "Création de sites web et d'applications web pour divers clients. Utilisation de technologies modernes.",
      technologies: ["React", "Node.js", "MongoDB", "AWS"]
    }
  ];

  educations = [
    {
      period: "2017 - 2019",
      title: "Master en Informatique",
      institution: "Université de Technologie",
      description: "Spécialisation en développement web et architectures distribuées. Projet de fin d'études sur les PWA."
    },
    {
      period: "2015 - 2017",
      title: "Licence Informatique",
      institution: "Université des Sciences",
      description: "Formation générale en informatique avec focus sur la programmation et les bases de données."
    },
    {
      period: "2023",
      title: "Certification Angular",
      institution: "Google Developers",
      description: "Certification officielle Angular Developer. Validation des compétences en développement Angular."
    }
  ];

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load skills
    this.portfolioService.getSkills().subscribe(skills => {
      this.skills = skills;
      this.topSkills = skills
        .sort((a, b) => b.level - a.level)
        .slice(0, 6);
    });

    // Load featured testimonials
    this.portfolioService.getTestimonials(true).subscribe(testimonials => {
      this.featuredTestimonials = testimonials;
    });

    // Load stats
    this.portfolioService.getPortfolioStats().subscribe(stats => {
      this.totalProjects = stats.total_projects;
      this.totalSkills = stats.total_skills;
      this.totalTestimonials = stats.total_testimonials;
    });
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
