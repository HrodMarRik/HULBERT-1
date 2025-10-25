import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ContactResponse, ContactDetailResponse } from '../../../../models/contact.model';
import { CompanyContact } from '../../../../models/company.model';
import { ProjectContact } from '../../../../models/project.model';

export interface ContactState {
  contact: ContactResponse | null;
  contactDetail: ContactDetailResponse | null;
  companyRoles: CompanyContact[];
  projectRoles: ProjectContact[];
  documents: any[];
  activeTab: string;
  isLoading: boolean;
  error: string | null;
  editingRole: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class ContactStateService {
  // State subjects
  private contactStateSubject = new BehaviorSubject<ContactState>({
    contact: null,
    contactDetail: null,
    companyRoles: [],
    projectRoles: [],
    documents: [],
    activeTab: 'overview',
    isLoading: false,
    error: null,
    editingRole: null
  });

  // Public observables
  public contactState$ = this.contactStateSubject.asObservable();

  // Action subjects for component communication
  private loadContactSubject = new Subject<number>();
  private updateContactSubject = new Subject<{id: number, data: any}>();
  private addDocumentSubject = new Subject<{contactId: number, documentData: any}>();
  private deleteDocumentSubject = new Subject<{contactId: number, documentId: number}>();
  private updateCompanyRoleSubject = new Subject<{contactId: number, companyId: number, data: any}>();
  private updateProjectRoleSubject = new Subject<{contactId: number, projectId: number, data: any}>();

  public loadContact$ = this.loadContactSubject.asObservable();
  public updateContact$ = this.updateContactSubject.asObservable();
  public addDocument$ = this.addDocumentSubject.asObservable();
  public deleteDocument$ = this.deleteDocumentSubject.asObservable();
  public updateCompanyRole$ = this.updateCompanyRoleSubject.asObservable();
  public updateProjectRole$ = this.updateProjectRoleSubject.asObservable();

  constructor() {}

  // State management methods
  getCurrentState(): ContactState {
    return this.contactStateSubject.value;
  }

  setContact(contact: ContactResponse): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      contact,
      error: null
    });
  }

  setContactDetail(contactDetail: ContactDetailResponse): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      contactDetail,
      error: null
    });
  }

  setCompanyRoles(companyRoles: CompanyContact[]): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      companyRoles
    });
  }

  setProjectRoles(projectRoles: ProjectContact[]): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      projectRoles
    });
  }

  setDocuments(documents: any[]): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      documents
    });
  }

  setActiveTab(tab: string): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      activeTab: tab
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      isLoading: loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      error
    });
  }

  setEditingRole(role: any | null): void {
    const currentState = this.getCurrentState();
    this.contactStateSubject.next({
      ...currentState,
      editingRole: role
    });
  }

  // Action triggers
  triggerLoadContact(contactId: number): void {
    this.loadContactSubject.next(contactId);
  }

  triggerUpdateContact(contactId: number, data: any): void {
    this.updateContactSubject.next({ id: contactId, data });
  }

  triggerAddDocument(contactId: number, documentData: any): void {
    this.addDocumentSubject.next({ contactId, documentData });
  }

  triggerDeleteDocument(contactId: number, documentId: number): void {
    this.deleteDocumentSubject.next({ contactId, documentId });
  }

  triggerUpdateCompanyRole(contactId: number, companyId: number, data: any): void {
    this.updateCompanyRoleSubject.next({ contactId, companyId, data });
  }

  triggerUpdateProjectRole(contactId: number, projectId: number, data: any): void {
    this.updateProjectRoleSubject.next({ contactId, projectId, data });
  }

  // Utility methods
  addDocument(document: any): void {
    const currentState = this.getCurrentState();
    this.setDocuments([...currentState.documents, document]);
  }

  removeDocument(documentId: number): void {
    const currentState = this.getCurrentState();
    this.setDocuments(currentState.documents.filter(d => d.id !== documentId));
  }

  updateCompanyRole(companyId: number, updates: Partial<CompanyContact>): void {
    const currentState = this.getCurrentState();
    const updatedRoles = currentState.companyRoles.map(role => 
      role.company_id === companyId ? { ...role, ...updates } : role
    );
    this.setCompanyRoles(updatedRoles);
  }

  updateProjectRole(projectId: number, updates: Partial<ProjectContact>): void {
    const currentState = this.getCurrentState();
    const updatedRoles = currentState.projectRoles.map(role => 
      role.project_id === projectId ? { ...role, ...updates } : role
    );
    this.setProjectRoles(updatedRoles);
  }

  updateContactField(field: string, value: any): void {
    const currentState = this.getCurrentState();
    if (currentState.contact) {
      const updatedContact = { ...currentState.contact, [field]: value };
      this.setContact(updatedContact);
    }
    if (currentState.contactDetail) {
      const updatedContactDetail = { ...currentState.contactDetail, [field]: value };
      this.setContactDetail(updatedContactDetail);
    }
  }

  // Computed properties
  getContact(): ContactResponse | null {
    return this.getCurrentState().contact;
  }

  getContactDetail(): ContactDetailResponse | null {
    return this.getCurrentState().contactDetail;
  }

  getCompanyRoles(): CompanyContact[] {
    return this.getCurrentState().companyRoles;
  }

  getProjectRoles(): ProjectContact[] {
    return this.getCurrentState().projectRoles;
  }

  getDocuments(): any[] {
    return this.getCurrentState().documents;
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

  getEditingRole(): any | null {
    return this.getCurrentState().editingRole;
  }

  // Statistics
  getCompaniesCount(): number {
    return this.getCompanyRoles().length;
  }

  getProjectsCount(): number {
    return this.getProjectRoles().length;
  }

  getDocumentsCount(): number {
    return this.getDocuments().length;
  }

  getPrimaryCompany(): CompanyContact | null {
    return this.getCompanyRoles().find(role => role.is_primary) || null;
  }

  // Validation methods
  validateContactData(contactData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contactData.first_name || contactData.first_name.trim() === '') {
      errors.push('Prénom requis');
    }

    if (!contactData.last_name || contactData.last_name.trim() === '') {
      errors.push('Nom requis');
    }

    if (!contactData.email || contactData.email.trim() === '') {
      errors.push('Email requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      errors.push('Format email invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateRoleData(roleData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!roleData.role || roleData.role.trim() === '') {
      errors.push('Rôle requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Reset state
  resetState(): void {
    this.contactStateSubject.next({
      contact: null,
      contactDetail: null,
      companyRoles: [],
      projectRoles: [],
      documents: [],
      activeTab: 'overview',
      isLoading: false,
      error: null,
      editingRole: null
    });
  }
}
