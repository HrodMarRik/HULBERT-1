import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ProjectResponse, ProjectCreate, ProjectUpdate } from '../../../../models/project.model';

export interface ProjectFilters {
  search: string;
  status: string;
  company: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  cancelled: number;
  planning: number;
}

export interface ProjectsState {
  projects: ProjectResponse[];
  filteredProjects: ProjectResponse[];
  stats: ProjectStats;
  filters: ProjectFilters;
  isLoading: boolean;
  error: string | null;
  showModal: boolean;
  editingProject: ProjectResponse | null;
  selectedProject: ProjectResponse | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsFilterService {
  // State subjects
  private projectsStateSubject = new BehaviorSubject<ProjectsState>({
    projects: [],
    filteredProjects: [],
    stats: {
      total: 0,
      active: 0,
      completed: 0,
      onHold: 0,
      cancelled: 0,
      planning: 0
    },
    filters: {
      search: '',
      status: 'all',
      company: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      pageSize: 20
    },
    isLoading: false,
    error: null,
    showModal: false,
    editingProject: null,
    selectedProject: null
  });

  // Public observables
  public projectsState$ = this.projectsStateSubject.asObservable();

  // Action subjects for component communication
  private loadProjectsSubject = new Subject<void>();
  private createProjectSubject = new Subject<ProjectCreate>();
  private updateProjectSubject = new Subject<{id: number, data: ProjectUpdate}>();
  private deleteProjectSubject = new Subject<number>();
  private applyFiltersSubject = new Subject<Partial<ProjectFilters>>();
  private openModalSubject = new Subject<ProjectResponse | null>();
  private closeModalSubject = new Subject<void>();

  public loadProjects$ = this.loadProjectsSubject.asObservable();
  public createProject$ = this.createProjectSubject.asObservable();
  public updateProject$ = this.updateProjectSubject.asObservable();
  public deleteProject$ = this.deleteProjectSubject.asObservable();
  public applyFilters$ = this.applyFiltersSubject.asObservable();
  public openModal$ = this.openModalSubject.asObservable();
  public closeModal$ = this.closeModalSubject.asObservable();

  constructor() {}

  // State management methods
  getCurrentState(): ProjectsState {
    return this.projectsStateSubject.value;
  }

  setProjects(projects: ProjectResponse[]): void {
    const currentState = this.getCurrentState();
    const filteredProjects = this.applyFiltersToProjects(projects, currentState.filters);
    const stats = this.calculateStats(projects);
    
    this.projectsStateSubject.next({
      ...currentState,
      projects,
      filteredProjects,
      stats,
      error: null
    });
  }

  setFilteredProjects(filteredProjects: ProjectResponse[]): void {
    const currentState = this.getCurrentState();
    this.projectsStateSubject.next({
      ...currentState,
      filteredProjects
    });
  }

  setFilters(filters: Partial<ProjectFilters>): void {
    const currentState = this.getCurrentState();
    const newFilters = { ...currentState.filters, ...filters };
    const filteredProjects = this.applyFiltersToProjects(currentState.projects, newFilters);
    
    this.projectsStateSubject.next({
      ...currentState,
      filters: newFilters,
      filteredProjects
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.getCurrentState();
    this.projectsStateSubject.next({
      ...currentState,
      isLoading: loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.getCurrentState();
    this.projectsStateSubject.next({
      ...currentState,
      error
    });
  }

  setShowModal(show: boolean): void {
    const currentState = this.getCurrentState();
    this.projectsStateSubject.next({
      ...currentState,
      showModal: show
    });
  }

  setEditingProject(project: ProjectResponse | null): void {
    const currentState = this.getCurrentState();
    this.projectsStateSubject.next({
      ...currentState,
      editingProject: project
    });
  }

  setSelectedProject(project: ProjectResponse | null): void {
    const currentState = this.getCurrentState();
    this.projectsStateSubject.next({
      ...currentState,
      selectedProject: project
    });
  }

  // Action triggers
  triggerLoadProjects(): void {
    this.loadProjectsSubject.next();
  }

  triggerCreateProject(projectData: ProjectCreate): void {
    this.createProjectSubject.next(projectData);
  }

  triggerUpdateProject(projectId: number, data: ProjectUpdate): void {
    this.updateProjectSubject.next({ id: projectId, data });
  }

  triggerDeleteProject(projectId: number): void {
    this.deleteProjectSubject.next(projectId);
  }

  triggerApplyFilters(filters: Partial<ProjectFilters>): void {
    this.applyFiltersSubject.next(filters);
  }

  triggerOpenModal(project: ProjectResponse | null = null): void {
    this.openModalSubject.next(project);
  }

  triggerCloseModal(): void {
    this.closeModalSubject.next();
  }

  // Utility methods
  addProject(project: ProjectResponse): void {
    const currentState = this.getCurrentState();
    const newProjects = [project, ...currentState.projects];
    const filteredProjects = this.applyFiltersToProjects(newProjects, currentState.filters);
    const stats = this.calculateStats(newProjects);
    
    this.projectsStateSubject.next({
      ...currentState,
      projects: newProjects,
      filteredProjects,
      stats
    });
  }

  updateProject(projectId: number, updates: Partial<ProjectResponse>): void {
    const currentState = this.getCurrentState();
    const updatedProjects = currentState.projects.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    );
    const filteredProjects = this.applyFiltersToProjects(updatedProjects, currentState.filters);
    const stats = this.calculateStats(updatedProjects);
    
    this.projectsStateSubject.next({
      ...currentState,
      projects: updatedProjects,
      filteredProjects,
      stats
    });
  }

  removeProject(projectId: number): void {
    const currentState = this.getCurrentState();
    const updatedProjects = currentState.projects.filter(p => p.id !== projectId);
    const filteredProjects = this.applyFiltersToProjects(updatedProjects, currentState.filters);
    const stats = this.calculateStats(updatedProjects);
    
    this.projectsStateSubject.next({
      ...currentState,
      projects: updatedProjects,
      filteredProjects,
      stats
    });
  }

  // Computed properties
  getProjects(): ProjectResponse[] {
    return this.getCurrentState().projects;
  }

  getFilteredProjects(): ProjectResponse[] {
    return this.getCurrentState().filteredProjects;
  }

  getStats(): ProjectStats {
    return this.getCurrentState().stats;
  }

  getFilters(): ProjectFilters {
    return this.getCurrentState().filters;
  }

  isLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  getError(): string | null {
    return this.getCurrentState().error;
  }

  getShowModal(): boolean {
    return this.getCurrentState().showModal;
  }

  getEditingProject(): ProjectResponse | null {
    return this.getCurrentState().editingProject;
  }

  getSelectedProject(): ProjectResponse | null {
    return this.getCurrentState().selectedProject;
  }

  // Filtering logic
  private applyFiltersToProjects(projects: ProjectResponse[], filters: ProjectFilters): ProjectResponse[] {
    let filtered = [...projects];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.company_name?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    // Company filter
    if (filters.company !== 'all') {
      filtered = filtered.filter(project => 
        project.company_name?.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'progress_percentage':
          aValue = a.progress_percentage;
          bValue = b.progress_percentage;
          break;
        case 'start_date':
          aValue = new Date(a.start_date || '');
          bValue = new Date(b.start_date || '');
          break;
        case 'end_date':
          aValue = new Date(a.end_date || '');
          bValue = new Date(b.end_date || '');
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }

  private calculateStats(projects: ProjectResponse[]): ProjectStats {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
      planning: projects.filter(p => p.status === 'planning').length
    };
  }

  // Pagination
  getPaginatedProjects(): ProjectResponse[] {
    const state = this.getCurrentState();
    const startIndex = (state.filters.page - 1) * state.filters.pageSize;
    const endIndex = startIndex + state.filters.pageSize;
    return state.filteredProjects.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    const state = this.getCurrentState();
    return Math.ceil(state.filteredProjects.length / state.filters.pageSize);
  }

  // Validation
  validateProjectData(projectData: ProjectCreate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!projectData.title || projectData.title.trim() === '') {
      errors.push('Le titre du projet est requis');
    }

    if (!projectData.company_id) {
      errors.push('L\'entreprise est requise');
    }

    if (projectData.progress_percentage !== undefined && 
        (projectData.progress_percentage < 0 || projectData.progress_percentage > 100)) {
      errors.push('Le pourcentage de progression doit être entre 0 et 100');
    }

    if (projectData.budget !== undefined && projectData.budget < 0) {
      errors.push('Le budget ne peut pas être négatif');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Reset state
  resetState(): void {
    this.projectsStateSubject.next({
      projects: [],
      filteredProjects: [],
      stats: {
        total: 0,
        active: 0,
        completed: 0,
        onHold: 0,
        cancelled: 0,
        planning: 0
      },
      filters: {
        search: '',
        status: 'all',
        company: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc',
        page: 1,
        pageSize: 20
      },
      isLoading: false,
      error: null,
      showModal: false,
      editingProject: null,
      selectedProject: null
    });
  }
}
