import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  technologies?: string[];
  images?: string[];
  url?: string;
  github_url?: string;
  category: string;
  featured: boolean;
  order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface PortfolioSkill {
  id: number;
  name: string;
  category: string;
  level: number;
  icon?: string;
  order: number;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface PortfolioTestimonial {
  id: number;
  author: string;
  role?: string;
  company?: string;
  content: string;
  avatar?: string;
  rating?: number;
  featured: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface PortfolioBlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  tags?: string[];
  views: number;
  featured: boolean;
  published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface PortfolioContact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  replied: boolean;
  created_at: string;
  created_by_user_id?: number;
}

export interface PortfolioStats {
  total_projects: number;
  total_skills: number;
  total_testimonials: number;
  total_blog_posts: number;
  total_contacts: number;
  featured_projects: number;
  published_blog_posts: number;
  unread_contacts: number;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  short_description?: string;
  technologies?: string[];
  images?: string[];
  url?: string;
  github_url?: string;
  category: string;
  featured?: boolean;
  order?: number;
  published?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  short_description?: string;
  technologies?: string[];
  images?: string[];
  url?: string;
  github_url?: string;
  category?: string;
  featured?: boolean;
  order?: number;
  published?: boolean;
}

export interface CreateSkillRequest {
  name: string;
  category: string;
  level: number;
  icon?: string;
  order?: number;
}

export interface UpdateSkillRequest {
  name?: string;
  category?: string;
  level?: number;
  icon?: string;
  order?: number;
}

export interface CreateTestimonialRequest {
  author: string;
  role?: string;
  company?: string;
  content: string;
  avatar?: string;
  rating?: number;
  featured?: boolean;
  order?: number;
}

export interface UpdateTestimonialRequest {
  author?: string;
  role?: string;
  company?: string;
  content?: string;
  avatar?: string;
  rating?: number;
  featured?: boolean;
  order?: number;
}

export interface CreateBlogPostRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  published_at?: string;
}

export interface UpdateBlogPostRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  published_at?: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = `${environment.apiUrl}/portfolio`;

  constructor(private http: HttpClient) {}

  // Projects
  createProject(project: CreateProjectRequest): Observable<PortfolioProject> {
    return this.http.post<PortfolioProject>(`${this.apiUrl}/projects`, project);
  }

  getProjects(featuredOnly?: boolean, publishedOnly?: boolean): Observable<PortfolioProject[]> {
    let params = new HttpParams();
    if (featuredOnly !== undefined) params = params.set('featured_only', featuredOnly.toString());
    if (publishedOnly !== undefined) params = params.set('published_only', publishedOnly.toString());
    return this.http.get<PortfolioProject[]>(`${this.apiUrl}/projects`, { params });
  }

  getProject(projectId: number): Observable<PortfolioProject> {
    return this.http.get<PortfolioProject>(`${this.apiUrl}/projects/${projectId}`);
  }

  updateProject(projectId: number, project: UpdateProjectRequest): Observable<PortfolioProject> {
    return this.http.put<PortfolioProject>(`${this.apiUrl}/projects/${projectId}`, project);
  }

  deleteProject(projectId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/projects/${projectId}`);
  }

  // Skills
  createSkill(skill: CreateSkillRequest): Observable<PortfolioSkill> {
    return this.http.post<PortfolioSkill>(`${this.apiUrl}/skills`, skill);
  }

  getSkills(category?: string): Observable<PortfolioSkill[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<PortfolioSkill[]>(`${this.apiUrl}/skills`, { params });
  }

  getSkill(skillId: number): Observable<PortfolioSkill> {
    return this.http.get<PortfolioSkill>(`${this.apiUrl}/skills/${skillId}`);
  }

  updateSkill(skillId: number, skill: UpdateSkillRequest): Observable<PortfolioSkill> {
    return this.http.put<PortfolioSkill>(`${this.apiUrl}/skills/${skillId}`, skill);
  }

  deleteSkill(skillId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/skills/${skillId}`);
  }

  // Testimonials
  createTestimonial(testimonial: CreateTestimonialRequest): Observable<PortfolioTestimonial> {
    return this.http.post<PortfolioTestimonial>(`${this.apiUrl}/testimonials`, testimonial);
  }

  getTestimonials(featuredOnly?: boolean): Observable<PortfolioTestimonial[]> {
    let params = new HttpParams();
    if (featuredOnly !== undefined) params = params.set('featured_only', featuredOnly.toString());
    return this.http.get<PortfolioTestimonial[]>(`${this.apiUrl}/testimonials`, { params });
  }

  getTestimonial(testimonialId: number): Observable<PortfolioTestimonial> {
    return this.http.get<PortfolioTestimonial>(`${this.apiUrl}/testimonials/${testimonialId}`);
  }

  updateTestimonial(testimonialId: number, testimonial: UpdateTestimonialRequest): Observable<PortfolioTestimonial> {
    return this.http.put<PortfolioTestimonial>(`${this.apiUrl}/testimonials/${testimonialId}`, testimonial);
  }

  deleteTestimonial(testimonialId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/testimonials/${testimonialId}`);
  }

  // Blog Posts
  createBlogPost(blogPost: CreateBlogPostRequest): Observable<PortfolioBlogPost> {
    return this.http.post<PortfolioBlogPost>(`${this.apiUrl}/blog`, blogPost);
  }

  getBlogPosts(featuredOnly?: boolean, publishedOnly?: boolean): Observable<PortfolioBlogPost[]> {
    let params = new HttpParams();
    if (featuredOnly !== undefined) params = params.set('featured_only', featuredOnly.toString());
    if (publishedOnly !== undefined) params = params.set('published_only', publishedOnly.toString());
    return this.http.get<PortfolioBlogPost[]>(`${this.apiUrl}/blog`, { params });
  }

  getBlogPost(blogId: number): Observable<PortfolioBlogPost> {
    return this.http.get<PortfolioBlogPost>(`${this.apiUrl}/blog/${blogId}`);
  }

  getBlogPostBySlug(slug: string): Observable<PortfolioBlogPost> {
    return this.http.get<PortfolioBlogPost>(`${this.apiUrl}/blog/slug/${slug}`);
  }

  updateBlogPost(blogId: number, blogPost: UpdateBlogPostRequest): Observable<PortfolioBlogPost> {
    return this.http.put<PortfolioBlogPost>(`${this.apiUrl}/blog/${blogId}`, blogPost);
  }

  deleteBlogPost(blogId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/blog/${blogId}`);
  }

  incrementBlogViews(blogId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/blog/${blogId}/view`, {});
  }

  // Contacts
  createContact(contact: CreateContactRequest): Observable<PortfolioContact> {
    return this.http.post<PortfolioContact>(`${this.apiUrl}/contacts`, contact);
  }

  getContacts(unreadOnly?: boolean): Observable<PortfolioContact[]> {
    let params = new HttpParams();
    if (unreadOnly !== undefined) params = params.set('unread_only', unreadOnly.toString());
    return this.http.get<PortfolioContact[]>(`${this.apiUrl}/contacts`, { params });
  }

  getContact(contactId: number): Observable<PortfolioContact> {
    return this.http.get<PortfolioContact>(`${this.apiUrl}/contacts/${contactId}`);
  }

  markContactAsReplied(contactId: number): Observable<PortfolioContact> {
    return this.http.put<PortfolioContact>(`${this.apiUrl}/contacts/${contactId}/reply`, {});
  }

  deleteContact(contactId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/contacts/${contactId}`);
  }

  // Stats
  getPortfolioStats(): Observable<PortfolioStats> {
    return this.http.get<PortfolioStats>(`${this.apiUrl}/stats`);
  }
}
