import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  images: string[];
  url?: string;
  githubUrl?: string;
  category: string;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PortfolioSkill {
  id: string;
  name: string;
  category: string;
  level: number;
  icon: string;
  order: number;
}

interface PortfolioTestimonial {
  id: string;
  author: string;
  role?: string;
  company?: string;
  content: string;
  avatar?: string;
  rating?: number;
  featured: boolean;
  order: number;
}

interface PortfolioBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  views: number;
  featured: boolean;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-portfolio-cms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="portfolio-cms-container">
      <div class="header">
        <h1>CMS Portfolio</h1>
        <p>Gérez le contenu de votre portfolio public</p>
      </div>

      <div class="main-content">
        <!-- Navigation Tabs -->
        <div class="tabs-navigation">
          <button class="tab-btn" 
                  [class.active]="activeTab === 'projects'"
                  (click)="setActiveTab('projects')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z"/>
            </svg>
            Projets
          </button>
          <button class="tab-btn" 
                  [class.active]="activeTab === 'skills'"
                  (click)="setActiveTab('skills')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            Compétences
          </button>
          <button class="tab-btn" 
                  [class.active]="activeTab === 'testimonials'"
                  (click)="setActiveTab('testimonials')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            Témoignages
          </button>
          <button class="tab-btn" 
                  [class.active]="activeTab === 'blog'"
                  (click)="setActiveTab('blog')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z"/>
            </svg>
            Blog
          </button>
        </div>

        <!-- Projects Tab -->
        <div class="tab-content" *ngIf="activeTab === 'projects'">
          <div class="content-header">
            <h2>Projets Portfolio</h2>
            <button class="btn btn-primary" (click)="addProject()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouveau Projet
            </button>
          </div>

          <div class="projects-grid">
            <div class="project-card" *ngFor="let project of projects">
              <div class="project-image">
                <img [src]="project.images[0] || '/assets/placeholder-project.png'" 
                     [alt]="project.title">
                <div class="project-status" [class]="project.published ? 'published' : 'draft'">
                  {{ project.published ? 'Publié' : 'Brouillon' }}
                </div>
              </div>
              
              <div class="project-content">
                <div class="project-header">
                  <h3>{{ project.title }}</h3>
                  <div class="project-actions">
                    <button class="btn-icon" (click)="editProject(project)" title="Modifier">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                      </svg>
                    </button>
                    <button class="btn-icon" (click)="deleteProject(project.id)" title="Supprimer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p class="project-description">{{ project.shortDescription }}</p>
                
                <div class="project-technologies">
                  <span class="tech-tag" *ngFor="let tech of project.technologies">{{ tech }}</span>
                </div>

                <div class="project-meta">
                  <span class="project-category">{{ project.category }}</span>
                  <span class="project-featured" *ngIf="project.featured">⭐ En vedette</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Skills Tab -->
        <div class="tab-content" *ngIf="activeTab === 'skills'">
          <div class="content-header">
            <h2>Compétences</h2>
            <button class="btn btn-primary" (click)="addSkill()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouvelle Compétence
            </button>
          </div>

          <div class="skills-grid">
            <div class="skill-card" *ngFor="let skill of skills">
              <div class="skill-header">
                <div class="skill-info">
                  <span class="skill-icon">{{ skill.icon }}</span>
                  <h3>{{ skill.name }}</h3>
                </div>
                <div class="skill-actions">
                  <button class="btn-icon" (click)="editSkill(skill)" title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="deleteSkill(skill.id)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="skill-level">
                <div class="level-bar">
                  <div class="level-fill" [style.width.%]="(skill.level / 5) * 100"></div>
                </div>
                <span class="level-text">{{ skill.level }}/5</span>
              </div>
              
              <div class="skill-category">{{ skill.category }}</div>
            </div>
          </div>
        </div>

        <!-- Testimonials Tab -->
        <div class="tab-content" *ngIf="activeTab === 'testimonials'">
          <div class="content-header">
            <h2>Témoignages</h2>
            <button class="btn btn-primary" (click)="addTestimonial()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouveau Témoignage
            </button>
          </div>

          <div class="testimonials-list">
            <div class="testimonial-card" *ngFor="let testimonial of testimonials">
              <div class="testimonial-header">
                <div class="testimonial-author">
                  <img [src]="testimonial.avatar || '/assets/placeholder-avatar.png'" 
                       [alt]="testimonial.author"
                       class="author-avatar">
                  <div class="author-info">
                    <h4>{{ testimonial.author }}</h4>
                    <p>{{ testimonial.role }}{{ testimonial.company ? ' chez ' + testimonial.company : '' }}</p>
                  </div>
                </div>
                <div class="testimonial-actions">
                  <button class="btn-icon" (click)="editTestimonial(testimonial)" title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="deleteTestimonial(testimonial.id)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="testimonial-content">
                <p>{{ testimonial.content }}</p>
                <div class="testimonial-rating" *ngIf="testimonial.rating">
                  <span class="stars">{{ '★'.repeat(testimonial.rating) }}{{ '☆'.repeat(5 - testimonial.rating) }}</span>
                </div>
              </div>
              
              <div class="testimonial-featured" *ngIf="testimonial.featured">
                ⭐ En vedette
              </div>
            </div>
          </div>
        </div>

        <!-- Blog Tab -->
        <div class="tab-content" *ngIf="activeTab === 'blog'">
          <div class="content-header">
            <h2>Articles de Blog</h2>
            <button class="btn btn-primary" (click)="addBlogPost()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouvel Article
            </button>
          </div>

          <div class="blog-posts-list">
            <div class="blog-post-card" *ngFor="let post of blogPosts">
              <div class="post-image">
                <img [src]="post.coverImage || '/assets/placeholder-blog.png'" 
                     [alt]="post.title">
                <div class="post-status" [class]="post.published ? 'published' : 'draft'">
                  {{ post.published ? 'Publié' : 'Brouillon' }}
                </div>
              </div>
              
              <div class="post-content">
                <div class="post-header">
                  <h3>{{ post.title }}</h3>
                  <div class="post-actions">
                    <button class="btn-icon" (click)="editBlogPost(post)" title="Modifier">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                      </svg>
                    </button>
                    <button class="btn-icon" (click)="deleteBlogPost(post.id)" title="Supprimer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p class="post-excerpt">{{ post.excerpt }}</p>
                
                <div class="post-tags">
                  <span class="tag" *ngFor="let tag of post.tags">{{ tag }}</span>
                </div>

                <div class="post-meta">
                  <span class="post-views">{{ post.views }} vues</span>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                  <span class="post-featured" *ngIf="post.featured">⭐ En vedette</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-cms-container {
      padding: 20px;
      background: #0f172a;
      min-height: 100vh;
      color: #f1f5f9;
    }

    .header {
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 28px;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .header p {
      color: #94a3b8;
      font-size: 16px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .tabs-navigation {
      display: flex;
      gap: 10px;
      background: #1e293b;
      border-radius: 10px;
      padding: 10px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: none;
      border: none;
      border-radius: 6px;
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background: #334155;
      color: #f1f5f9;
    }

    .tab-btn.active {
      background: #3b82f6;
      color: white;
    }

    .tab-content {
      background: #1e293b;
      border-radius: 10px;
      padding: 20px;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .content-header h2 {
      font-size: 20px;
      color: #f1f5f9;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-icon {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
    }

    .btn-icon.delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .project-card {
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      overflow: hidden;
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

    .project-status {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .project-status.published {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .project-status.draft {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .project-content {
      padding: 20px;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .project-header h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin: 0;
    }

    .project-actions {
      display: flex;
      gap: 8px;
    }

    .project-description {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .project-technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 15px;
    }

    .tech-tag {
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .project-meta {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .project-category {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .project-featured {
      color: #f59e0b;
      font-size: 12px;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .skill-card {
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
    }

    .skill-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .skill-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .skill-icon {
      font-size: 24px;
    }

    .skill-info h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin: 0;
    }

    .skill-level {
      margin-bottom: 15px;
    }

    .level-bar {
      width: 100%;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
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

    .skill-category {
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      display: inline-block;
    }

    .testimonials-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .testimonial-card {
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
    }

    .testimonial-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .author-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-info h4 {
      font-size: 16px;
      color: #f1f5f9;
      margin: 0 0 4px 0;
    }

    .author-info p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }

    .testimonial-content {
      margin-bottom: 15px;
    }

    .testimonial-content p {
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.5;
    }

    .testimonial-rating {
      margin-top: 10px;
    }

    .stars {
      color: #f59e0b;
      font-size: 16px;
    }

    .testimonial-featured {
      color: #f59e0b;
      font-size: 12px;
    }

    .blog-posts-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .blog-post-card {
      display: flex;
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      overflow: hidden;
    }

    .post-image {
      position: relative;
      width: 200px;
      height: 150px;
      flex-shrink: 0;
    }

    .post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post-status {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .post-status.published {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .post-status.draft {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .post-content {
      flex: 1;
      padding: 20px;
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .post-header h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin: 0;
    }

    .post-actions {
      display: flex;
      gap: 8px;
    }

    .post-excerpt {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 15px;
    }

    .tag {
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .post-meta {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .post-views, .post-date {
      font-size: 12px;
      color: #94a3b8;
    }

    .post-featured {
      color: #f59e0b;
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .tabs-navigation {
        flex-wrap: wrap;
      }
      
      .projects-grid, .skills-grid {
        grid-template-columns: 1fr;
      }
      
      .blog-post-card {
        flex-direction: column;
      }
      
      .post-image {
        width: 100%;
        height: 200px;
      }
    }
  `]
})
export class PortfolioCmsComponent implements OnInit {
  activeTab: 'projects' | 'skills' | 'testimonials' | 'blog' = 'projects';

  projects: PortfolioProject[] = [
    {
      id: '1',
      title: 'Application E-commerce',
      description: 'Application e-commerce complète avec panier, paiement et gestion des commandes',
      shortDescription: 'Plateforme e-commerce moderne avec React et Node.js',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      images: ['https://via.placeholder.com/400x300'],
      url: 'https://example.com',
      githubUrl: 'https://github.com/example',
      category: 'Web Development',
      featured: true,
      order: 1,
      published: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  skills: PortfolioSkill[] = [
    {
      id: '1',
      name: 'Angular',
      category: 'Frontend',
      level: 5,
      icon: '🅰️',
      order: 1
    },
    {
      id: '2',
      name: 'Python',
      category: 'Backend',
      level: 4,
      icon: '🐍',
      order: 2
    }
  ];

  testimonials: PortfolioTestimonial[] = [
    {
      id: '1',
      author: 'Jean Dupont',
      role: 'CEO',
      company: 'TechCorp',
      content: 'Excellent travail sur notre projet. Très professionnel et à l\'écoute.',
      avatar: 'https://via.placeholder.com/50x50',
      rating: 5,
      featured: true,
      order: 1
    }
  ];

  blogPosts: PortfolioBlogPost[] = [
    {
      id: '1',
      title: 'Introduction à Angular',
      slug: 'introduction-angular',
      content: 'Contenu complet de l\'article...',
      excerpt: 'Découvrez les bases d\'Angular pour développer des applications web modernes.',
      coverImage: 'https://via.placeholder.com/400x200',
      tags: ['Angular', 'Frontend', 'Tutorial'],
      views: 150,
      featured: true,
      published: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  setActiveTab(tab: 'projects' | 'skills' | 'testimonials' | 'blog') {
    this.activeTab = tab;
  }

  addProject() {
    console.log('Add new project');
  }

  editProject(project: PortfolioProject) {
    console.log('Edit project:', project);
  }

  deleteProject(id: string) {
    this.projects = this.projects.filter(p => p.id !== id);
  }

  addSkill() {
    console.log('Add new skill');
  }

  editSkill(skill: PortfolioSkill) {
    console.log('Edit skill:', skill);
  }

  deleteSkill(id: string) {
    this.skills = this.skills.filter(s => s.id !== id);
  }

  addTestimonial() {
    console.log('Add new testimonial');
  }

  editTestimonial(testimonial: PortfolioTestimonial) {
    console.log('Edit testimonial:', testimonial);
  }

  deleteTestimonial(id: string) {
    this.testimonials = this.testimonials.filter(t => t.id !== id);
  }

  addBlogPost() {
    console.log('Add new blog post');
  }

  editBlogPost(post: PortfolioBlogPost) {
    console.log('Edit blog post:', post);
  }

  deleteBlogPost(id: string) {
    this.blogPosts = this.blogPosts.filter(p => p.id !== id);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }
}
