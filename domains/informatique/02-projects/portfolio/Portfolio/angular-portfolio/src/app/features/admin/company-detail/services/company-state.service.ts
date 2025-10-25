import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CompanyResponse, CompanyContact, ProjectResponse } from '../../../../models/company.model';

export interface CompanyState {
  company: CompanyResponse | null;
  contacts: CompanyContact[];
  projects: ProjectResponse[];
  activeTab: string;
  isLoading: boolean;
  error: string | null;
  editingContact: CompanyContact | null;
  editingProject: ProjectResponse | null;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyStateService {
  // State subjects
  private companyStateSubject = new BehaviorSubject<CompanyState>({
    company: null,
    contacts: [],
    projects: [],
    activeTab: 'overview',
    isLoading: false,
    error: null,
    editingContact: null,
    editingProject: null
  });

  // Public observables
  public companyState$ = this.companyStateSubject.asObservable();

  // Action subjects for component communication
  private loadCompanySubject = new Subject<number>();
  private updateCompanySubject = new Subject<{id: number, data: any}>();
  private addContactSubject = new Subject<{companyId: number, contactData: any}>();
  private updateContactSubject = new Subject<{companyId: number, contactId: number, data: any}>();
  private deleteContactSubject = new Subject<{companyId: number, contactId: number}>();
  private addProjectSubject = new Subject<{companyId: number, projectData: any}>();
  private updateProjectSubject = new Subject<{companyId: number, projectId: number, data: any}>();
  private deleteProjectSubject = new Subject<{companyId: number, projectId: number}>();

  public loadCompany$ = this.loadCompanySubject.asObservable();
  public updateCompany$ = this.updateCompanySubject.asObservable();
  public addContact$ = this.addContactSubject.asObservable();
  public updateContact$ = this.updateContactSubject.asObservable();
  public deleteContact$ = this.deleteContactSubject.asObservable();
  public addProject$ = this.addProjectSubject.asObservable();
  public updateProject$ = this.updateProjectSubject.asObservable();
  public deleteProject$ = this.deleteProjectSubject.asObservable();

  constructor() {}

  // State management methods
  getCurrentState(): CompanyState {
    return this.companyStateSubject.value;
  }

  setCompany(company: CompanyResponse): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      company,
      error: null
    });
  }

  setContacts(contacts: CompanyContact[]): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      contacts
    });
  }

  setProjects(projects: ProjectResponse[]): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      projects
    });
  }

  setActiveTab(tab: string): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      activeTab: tab
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      isLoading: loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      error
    });
  }

  setEditingContact(contact: CompanyContact | null): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      editingContact: contact
    });
  }

  setEditingProject(project: ProjectResponse | null): void {
    const currentState = this.getCurrentState();
    this.companyStateSubject.next({
      ...currentState,
      editingProject: project
    });
  }

  // Action triggers
  triggerLoadCompany(companyId: number): void {
    this.loadCompanySubject.next(companyId);
  }

  triggerUpdateCompany(companyId: number, data: any): void {
    this.updateCompanySubject.next({ id: companyId, data });
  }

  triggerAddContact(companyId: number, contactData: any): void {
    this.addContactSubject.next({ companyId, contactData });
  }

  triggerUpdateContact(companyId: number, contactId: number, data: any): void {
    this.updateContactSubject.next({ companyId, contactId, data });
  }

  triggerDeleteContact(companyId: number, contactId: number): void {
    this.deleteContactSubject.next({ companyId, contactId });
  }

  triggerAddProject(companyId: number, projectData: any): void {
    this.addProjectSubject.next({ companyId, projectData });
  }

  triggerUpdateProject(companyId: number, projectId: number, data: any): void {
    this.updateProjectSubject.next({ companyId, projectId, data });
  }

  triggerDeleteProject(companyId: number, projectId: number): void {
    this.deleteProjectSubject.next({ companyId, projectId });
  }

  // Utility methods
  addContact(contact: CompanyContact): void {
    const currentState = this.getCurrentState();
    this.setContacts([...currentState.contacts, contact]);
  }

  updateContact(contactId: number, updates: Partial<CompanyContact>): void {
    const currentState = this.getCurrentState();
    const updatedContacts = currentState.contacts.map(c => 
      c.id === contactId ? { ...c, ...updates } : c
    );
    this.setContacts(updatedContacts);
  }

  removeContact(contactId: number): void {
    const currentState = this.getCurrentState();
    this.setContacts(currentState.contacts.filter(c => c.id !== contactId));
  }

  addProject(project: ProjectResponse): void {
    const currentState = this.getCurrentState();
    this.setProjects([...currentState.projects, project]);
  }

  updateProject(projectId: number, updates: Partial<ProjectResponse>): void {
    const currentState = this.getCurrentState();
    const updatedProjects = currentState.projects.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    );
    this.setProjects(updatedProjects);
  }

  removeProject(projectId: number): void {
    const currentState = this.getCurrentState();
    this.setProjects(currentState.projects.filter(p => p.id !== projectId));
  }

  updateCompanyField(field: string, value: any): void {
    const currentState = this.getCurrentState();
    if (currentState.company) {
      const updatedCompany = { ...currentState.company, [field]: value };
      this.setCompany(updatedCompany);
    }
  }

  // Computed properties
  getCompany(): CompanyResponse | null {
    return this.getCurrentState().company;
  }

  getContacts(): CompanyContact[] {
    return this.getCurrentState().contacts;
  }

  getProjects(): ProjectResponse[] {
    return this.getCurrentState().projects;
  }

  getActiveTab(): string {
    return this.getCurrentState().activeTab;
  }

  isLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  getError(): string | null {
    return this.getCurrentState().error;
  }

  getEditingContact(): CompanyContact | null {
    return this.getCurrentState().editingContact;
  }

  getEditingProject(): ProjectResponse | null {
    return this.getCurrentState().editingProject;
  }

  // Statistics
  getContactsCount(): number {
    return this.getContacts().length;
  }

  getProjectsCount(): number {
    return this.getProjects().length;
  }

  getActiveProjectsCount(): number {
    return this.getProjects().filter(p => p.status === 'active').length;
  }

  getCompletedProjectsCount(): number {
    return this.getProjects().filter(p => p.status === 'completed').length;
  }

  getPrimaryContact(): CompanyContact | null {
    return this.getContacts().find(c => c.is_primary) || null;
  }

  // Validation methods
  validateContactData(contactData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contactData.contact_id) {
      errors.push('Contact is required');
    }

    if (!contactData.role || contactData.role.trim() === '') {
      errors.push('Role is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateProjectData(projectData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!projectData.title || projectData.title.trim() === '') {
      errors.push('Project title is required');
    }

    if (!projectData.status) {
      errors.push('Project status is required');
    }

    if (projectData.progress_percentage < 0 || projectData.progress_percentage > 100) {
      errors.push('Progress percentage must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Reset state
  resetState(): void {
    this.companyStateSubject.next({
      company: null,
      contacts: [],
      projects: [],
      activeTab: 'overview',
      isLoading: false,
      error: null,
      editingContact: null,
      editingProject: null
    });
  }
}
