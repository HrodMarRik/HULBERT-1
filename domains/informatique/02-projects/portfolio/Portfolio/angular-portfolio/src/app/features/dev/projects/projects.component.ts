import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="projects-section">
      <div class="container">
        <h2>Mes Projets</h2>
        
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            [class.active]="selectedFilter === 'all'"
            (click)="filterProjects('all')">
            Tous
          </button>
          <button 
            class="filter-btn" 
            [class.active]="selectedFilter === 'angular'"
            (click)="filterProjects('angular')">
            Angular
          </button>
          <button 
            class="filter-btn" 
            [class.active]="selectedFilter === 'node'"
            (click)="filterProjects('node')">
            Node.js
          </button>
          <button 
            class="filter-btn" 
            [class.active]="selectedFilter === 'python'"
            (click)="filterProjects('python')">
            Python
          </button>
        </div>

        <div class="projects-grid">
          <div 
            class="project-card" 
            *ngFor="let project of filteredProjects">
            <div class="project-image">
              <div class="image-placeholder">{{ project.icon }}</div>
            </div>
            <div class="project-content">
              <h3>{{ project.title }}</h3>
              <p class="project-description">{{ project.description }}</p>
              <div class="project-tech">
                <span class="tech-tag" *ngFor="let tech of project.technologies">{{ tech }}</span>
              </div>
              <div class="project-links">
                <a [href]="project.github" target="_blank" class="project-link">
                  <span>📁</span> GitHub
                </a>
                <a [href]="project.demo" target="_blank" class="project-link" *ngIf="project.demo">
                  <span>🌐</span> Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .projects-section {
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

    .filter-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 10px 20px;
      border: 2px solid #3498db;
      background: transparent;
      color: #3498db;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
    }

    .filter-btn:hover,
    .filter-btn.active {
      background: #3498db;
      color: white;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .project-card {
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .project-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }

    .project-image {
      height: 200px;
      background: linear-gradient(135deg, #3498db, #1abc9c);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-placeholder {
      font-size: 4rem;
      opacity: 0.8;
    }

    .project-content {
      padding: 25px;
    }

    .project-content h3 {
      margin: 0 0 15px 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .project-description {
      margin-bottom: 20px;
      line-height: 1.6;
      color: #555;
    }

    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .tech-tag {
      background: linear-gradient(135deg, #3498db, #1abc9c);
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .project-links {
      display: flex;
      gap: 15px;
    }

    .project-link {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 8px 16px;
      background: #ecf0f1;
      color: #2c3e50;
      text-decoration: none;
      border-radius: 20px;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .project-link:hover {
      background: #3498db;
      color: white;
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

    :host-context(.gaming-theme) .filter-btn {
      border-color: #ff4655;
      color: #ff4655;
    }

    :host-context(.gaming-theme) .filter-btn:hover,
    :host-context(.gaming-theme) .filter-btn.active {
      background: #ff4655;
    }

    :host-context(.gaming-theme) .project-card {
      background: rgba(15, 25, 35, 0.8);
      color: white;
      border: 1px solid rgba(255, 70, 85, 0.3);
    }

    :host-context(.gaming-theme) .project-image {
      background: linear-gradient(135deg, #ff4655, #fd4556);
    }

    :host-context(.gaming-theme) .project-content h3 {
      color: #ff4655;
    }

    :host-context(.gaming-theme) .tech-tag {
      background: linear-gradient(135deg, #ff4655, #fd4556);
    }

    :host-context(.gaming-theme) .project-link {
      background: rgba(255, 70, 85, 0.2);
      color: white;
    }

    :host-context(.gaming-theme) .project-link:hover {
      background: #ff4655;
    }

    @media (max-width: 768px) {
      .projects-grid {
        grid-template-columns: 1fr;
      }
      
      .filter-buttons {
        gap: 10px;
      }
      
      .filter-btn {
        padding: 8px 16px;
        font-size: 0.9rem;
      }
      
      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class ProjectsComponent {
  selectedFilter = 'all';
  
  projects = [
    {
      title: 'E-Commerce Platform',
      description: 'Plateforme e-commerce complète avec gestion des commandes, paiements et inventaire.',
      technologies: ['Angular', 'Node.js', 'PostgreSQL', 'Stripe'],
      github: 'https://github.com/example/ecommerce',
      demo: 'https://ecommerce-demo.com',
      icon: '🛒',
      category: 'angular'
    },
    {
      title: 'Task Management App',
      description: 'Application de gestion de tâches avec collaboration en temps réel.',
      technologies: ['Angular', 'Socket.io', 'MongoDB'],
      github: 'https://github.com/example/taskmanager',
      demo: 'https://taskmanager-demo.com',
      icon: '📋',
      category: 'angular'
    },
    {
      title: 'API REST Service',
      description: 'Service API REST robuste avec authentification JWT et documentation Swagger.',
      technologies: ['Node.js', 'Express', 'JWT', 'Swagger'],
      github: 'https://github.com/example/api-service',
      demo: null,
      icon: '🔌',
      category: 'node'
    },
    {
      title: 'Data Analysis Tool',
      description: 'Outil d\'analyse de données avec visualisations interactives.',
      technologies: ['Python', 'Pandas', 'Matplotlib', 'Flask'],
      github: 'https://github.com/example/data-analysis',
      demo: 'https://data-analysis-demo.com',
      icon: '📊',
      category: 'python'
    },
    {
      title: 'Portfolio Website',
      description: 'Site portfolio responsive avec animations et thème sombre.',
      technologies: ['Angular', 'SCSS', 'TypeScript'],
      github: 'https://github.com/example/portfolio',
      demo: 'https://portfolio-demo.com',
      icon: '💼',
      category: 'angular'
    },
    {
      title: 'Chat Application',
      description: 'Application de chat en temps réel avec rooms et notifications.',
      technologies: ['Node.js', 'Socket.io', 'React'],
      github: 'https://github.com/example/chat-app',
      demo: 'https://chat-demo.com',
      icon: '💬',
      category: 'node'
    }
  ];

  get filteredProjects() {
    if (this.selectedFilter === 'all') {
      return this.projects;
    }
    return this.projects.filter(project => project.category === this.selectedFilter);
  }

  filterProjects(filter: string) {
    this.selectedFilter = filter;
  }
}
