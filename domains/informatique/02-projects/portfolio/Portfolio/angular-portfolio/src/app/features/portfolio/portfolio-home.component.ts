import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortfolioService, PortfolioProject, PortfolioSkill, PortfolioTestimonial, PortfolioBlogPost } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="portfolio-home">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="gradient-text">Développeur Full-Stack</span>
              <br>
              <span class="subtitle">Créateur d'expériences digitales</span>
            </h1>
            <p class="hero-description">
              Je transforme vos idées en solutions technologiques innovantes. 
              Spécialisé dans le développement web moderne avec Angular, FastAPI et PostgreSQL.
            </p>
            <div class="hero-actions">
              <a routerLink="/portfolio/projects" class="btn btn-primary">
                <span class="btn-icon">🚀</span>
                Voir mes projets
              </a>
              <a routerLink="/portfolio/contact" class="btn btn-secondary">
                <span class="btn-icon">💬</span>
                Me contacter
              </a>
            </div>
          </div>
          <div class="hero-visual">
            <div class="code-animation">
              <div class="code-line" *ngFor="let line of codeLines; let i = index" 
                   [style.animation-delay]="(i * 0.1) + 's'">
                {{ line }}
              </div>
            </div>
          </div>
        </div>
        <div class="scroll-indicator">
          <div class="scroll-arrow"></div>
        </div>
      </section>

      <!-- Featured Projects -->
      <section class="featured-projects" *ngIf="featuredProjects.length > 0">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Projets en vedette</h2>
            <p class="section-subtitle">Découvrez mes réalisations les plus marquantes</p>
          </div>
          <div class="projects-grid">
            <div class="project-card" *ngFor="let project of featuredProjects.slice(0, 3)" 
                 [routerLink]="['/portfolio/projects', project.id]">
              <div class="project-image" *ngIf="project.images && project.images.length > 0">
                <img [src]="project.images[0]" [alt]="project.title">
                <div class="project-overlay">
                  <div class="project-actions">
                    <button class="action-btn" *ngIf="project.url">
                      <span class="btn-icon">🌐</span>
                      Site web
                    </button>
                    <button class="action-btn" *ngIf="project.github_url">
                      <span class="btn-icon">📁</span>
                      Code source
                    </button>
                  </div>
                </div>
              </div>
              <div class="project-content">
                <div class="project-category">{{ project.category }}</div>
                <h3 class="project-title">{{ project.title }}</h3>
                <p class="project-description">{{ project.short_description || project.description }}</p>
                <div class="project-technologies" *ngIf="project.technologies">
                  <span class="tech-tag" *ngFor="let tech of project.technologies.slice(0, 3)">
                    {{ tech }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="section-footer">
            <a routerLink="/portfolio/projects" class="btn btn-outline">
              Voir tous les projets
              <span class="btn-icon">→</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Skills Overview -->
      <section class="skills-overview" *ngIf="skills.length > 0">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Compétences techniques</h2>
            <p class="section-subtitle">Technologies et outils que je maîtrise</p>
          </div>
          <div class="skills-grid">
            <div class="skill-category" *ngFor="let category of skillCategories">
              <h3 class="category-title">{{ category }}</h3>
              <div class="skills-list">
                <div class="skill-item" *ngFor="let skill of getSkillsByCategory(category)">
                  <div class="skill-info">
                    <span class="skill-icon" *ngIf="skill.icon">{{ skill.icon }}</span>
                    <span class="skill-name">{{ skill.name }}</span>
                  </div>
                  <div class="skill-level">
                    <div class="level-bar">
                      <div class="level-fill" [style.width.%]="(skill.level / 5) * 100"></div>
                    </div>
                    <span class="level-text">{{ skill.level }}/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Latest Blog Posts -->
      <section class="latest-blog" *ngIf="latestBlogPosts.length > 0">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Derniers articles</h2>
            <p class="section-subtitle">Mes réflexions sur le développement et la technologie</p>
          </div>
          <div class="blog-grid">
            <article class="blog-card" *ngFor="let post of latestBlogPosts.slice(0, 3)" 
                     [routerLink]="['/portfolio/blog', post.slug]">
              <div class="blog-image" *ngIf="post.cover_image">
                <img [src]="post.cover_image" [alt]="post.title">
              </div>
              <div class="blog-content">
                <div class="blog-meta">
                  <span class="blog-date">{{ formatDate(post.published_at || post.created_at) }}</span>
                  <span class="blog-views">{{ post.views }} vues</span>
                </div>
                <h3 class="blog-title">{{ post.title }}</h3>
                <p class="blog-excerpt">{{ post.excerpt || post.content }}</p>
                <div class="blog-tags" *ngIf="post.tags">
                  <span class="tag" *ngFor="let tag of post.tags.slice(0, 3)">{{ tag }}</span>
                </div>
              </div>
            </article>
          </div>
          <div class="section-footer">
            <a routerLink="/portfolio/blog" class="btn btn-outline">
              Voir tous les articles
              <span class="btn-icon">→</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="testimonials" *ngIf="featuredTestimonials.length > 0">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Témoignages clients</h2>
            <p class="section-subtitle">Ce que disent mes clients</p>
          </div>
          <div class="testimonials-grid">
            <div class="testimonial-card" *ngFor="let testimonial of featuredTestimonials.slice(0, 3)">
              <div class="testimonial-content">
                <div class="testimonial-rating" *ngIf="testimonial.rating">
                  <span class="star" *ngFor="let star of getStars(testimonial.rating)">⭐</span>
                </div>
                <blockquote class="testimonial-text">"{{ testimonial.content }}"</blockquote>
                <div class="testimonial-author">
                  <div class="author-avatar" *ngIf="testimonial.avatar">
                    <img [src]="testimonial.avatar" [alt]="testimonial.author">
                  </div>
                  <div class="author-info">
                    <div class="author-name">{{ testimonial.author }}</div>
                    <div class="author-role" *ngIf="testimonial.role">{{ testimonial.role }}</div>
                    <div class="author-company" *ngIf="testimonial.company">{{ testimonial.company }}</div>
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
            <h2 class="cta-title">Prêt à collaborer ?</h2>
            <p class="cta-description">
              Discutons de votre projet et créons ensemble quelque chose d'extraordinaire.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/contact" class="btn btn-primary btn-large">
                <span class="btn-icon">💬</span>
                Commencer un projet
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
    .portfolio-home {
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
    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 20px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 1.5rem;
      font-weight: 400;
    }

    .hero-description {
      font-size: 1.2rem;
      color: #cbd5e1;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 20px;
    }

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

    .btn-outline {
      background: transparent;
      color: #94a3b8;
      border: 1px solid #475569;
    }

    .btn-outline:hover {
      color: #60a5fa;
      border-color: #60a5fa;
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 1.1rem;
    }

    .btn-icon {
      font-size: 1.2em;
    }

    /* Code Animation */
    .hero-visual {
      position: relative;
    }

    .code-animation {
      background: #1e293b;
      border-radius: 12px;
      padding: 30px;
      border: 1px solid #334155;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
      line-height: 1.6;
    }

    .code-line {
      opacity: 0;
      animation: fadeInUp 0.6s ease forwards;
      color: #60a5fa;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
      from {
        opacity: 0;
        transform: translateY(20px);
      }
    }

    /* Scroll Indicator */
    .scroll-indicator {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
    }

    .scroll-arrow {
      width: 20px;
      height: 20px;
      border-right: 2px solid #60a5fa;
      border-bottom: 2px solid #60a5fa;
      transform: rotate(45deg);
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: rotate(45deg) translateY(0);
      }
      40% {
        transform: rotate(45deg) translateY(-10px);
      }
      60% {
        transform: rotate(45deg) translateY(-5px);
      }
    }

    /* Sections */
    section {
      padding: 80px 0;
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

    .section-footer {
      text-align: center;
      margin-top: 40px;
    }

    /* Featured Projects */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .project-card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .project-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .project-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .project-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .project-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .project-card:hover .project-overlay {
      opacity: 1;
    }

    .project-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }

    .project-content {
      padding: 24px;
    }

    .project-category {
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .project-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .project-description {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .project-technologies {
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

    /* Skills */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
    }

    .skill-category {
      background: #1e293b;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .category-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #60a5fa;
    }

    .skill-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .skill-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .skill-icon {
      font-size: 1.2em;
    }

    .skill-name {
      font-weight: 500;
    }

    .skill-level {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .level-bar {
      width: 80px;
      height: 6px;
      background: #334155;
      border-radius: 3px;
      overflow: hidden;
    }

    .level-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      transition: width 0.3s ease;
    }

    .level-text {
      font-size: 12px;
      color: #94a3b8;
    }

    /* Blog */
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .blog-card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .blog-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .blog-image {
      height: 200px;
      overflow: hidden;
    }

    .blog-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .blog-content {
      padding: 24px;
    }

    .blog-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 12px;
      color: #94a3b8;
    }

    .blog-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .blog-excerpt {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .blog-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      background: #334155;
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    /* Testimonials */
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .testimonial-card {
      background: #1e293b;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .testimonial-rating {
      margin-bottom: 16px;
    }

    .star {
      font-size: 1.2em;
    }

    .testimonial-text {
      font-style: italic;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 20px;
      color: #cbd5e1;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .author-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      overflow: hidden;
    }

    .author-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .author-name {
      font-weight: 600;
      color: #f1f5f9;
    }

    .author-role {
      color: #60a5fa;
      font-size: 14px;
    }

    .author-company {
      color: #94a3b8;
      font-size: 14px;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(135deg, #1e293b, #334155);
      text-align: center;
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

    /* Responsive */
    @media (max-width: 768px) {
      .hero-content {
        grid-template-columns: 1fr;
        gap: 40px;
        text-align: center;
      }

      .hero-title {
        font-size: 2.5rem;
      }

      .hero-actions {
        justify-content: center;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }

      .projects-grid,
      .blog-grid,
      .testimonials-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PortfolioHomeComponent implements OnInit {
  featuredProjects: PortfolioProject[] = [];
  skills: PortfolioSkill[] = [];
  featuredTestimonials: PortfolioTestimonial[] = [];
  latestBlogPosts: PortfolioBlogPost[] = [];
  skillCategories: string[] = [];

  codeLines = [
    'const developer = {',
    '  name: "Votre Développeur",',
    '  skills: ["Angular", "FastAPI"],',
    '  passion: "Créer des solutions",',
    '  available: true',
    '};',
    '',
    'developer.build(project);'
  ];

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load featured projects
    this.portfolioService.getProjects(true, true).subscribe(projects => {
      this.featuredProjects = projects;
    });

    // Load skills
    this.portfolioService.getSkills().subscribe(skills => {
      this.skills = skills;
      this.skillCategories = [...new Set(skills.map(s => s.category))];
    });

    // Load featured testimonials
    this.portfolioService.getTestimonials(true).subscribe(testimonials => {
      this.featuredTestimonials = testimonials;
    });

    // Load latest blog posts
    this.portfolioService.getBlogPosts(false, true).subscribe(posts => {
      this.latestBlogPosts = posts;
    });
  }

  getSkillsByCategory(category: string): PortfolioSkill[] {
    return this.skills.filter(skill => skill.category === category);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
