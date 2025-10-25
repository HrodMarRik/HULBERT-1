import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectCreate, ProjectUpdate, ProjectStats, ProjectPhase, ProjectPhaseCreate, ProjectPhaseUpdate, ProjectDeliverable, ProjectDeliverableCreate, ProjectDeliverableUpdate, ProjectNote, ProjectNoteCreate, ProjectNoteUpdate, ProjectDetailResponse } from '../../models/project.model';
import { Contact } from '../../models/contact.model';
import { CalendarEventResponse } from '../../models/calendar.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8000/api/projects';

  constructor(private http: HttpClient) {}

  // CRUD Operations
  getProjects(params?: any): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl, { params });
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: ProjectCreate): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: ProjectUpdate): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, project);
  }

  updateProjectField(projectId: number, field: string, value: any): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}`, { [field]: value });
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Company-specific projects
  getProjectsByCompany(companyId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}?company_id=${companyId}`);
  }

  // Contact-specific projects
  getContactProjects(contactId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?primary_contact_id=${contactId}`);
  }

  // Stats
  getStats(): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.apiUrl}/stats/summary`);
  }

  // Project Phases
  addPhaseToProject(projectId: number, phase: ProjectPhaseCreate): Observable<ProjectPhase> {
    return this.http.post<ProjectPhase>(`${this.apiUrl}/${projectId}/phases`, phase);
  }

  updateProjectPhase(projectId: number, phaseId: number, phase: ProjectPhaseUpdate): Observable<ProjectPhase> {
    return this.http.patch<ProjectPhase>(`${this.apiUrl}/${projectId}/phases/${phaseId}`, phase);
  }

  deleteProjectPhase(projectId: number, phaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/phases/${phaseId}`);
  }

  // Project Deliverables
  addDeliverableToProject(projectId: number, deliverable: ProjectDeliverableCreate): Observable<ProjectDeliverable> {
    return this.http.post<ProjectDeliverable>(`${this.apiUrl}/${projectId}/deliverables`, deliverable);
  }

  updateProjectDeliverable(projectId: number, deliverableId: number, deliverable: ProjectDeliverableUpdate): Observable<ProjectDeliverable> {
    return this.http.patch<ProjectDeliverable>(`${this.apiUrl}/${projectId}/deliverables/${deliverableId}`, deliverable);
  }

  deleteProjectDeliverable(projectId: number, deliverableId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/deliverables/${deliverableId}`);
  }

  // Documents
  addDocumentToProject(projectId: number, document: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${projectId}/documents`, document);
  }

  // Project Detail (with all related data)
  getProjectDetail(id: number): Observable<ProjectDetailResponse> {
    return this.http.get<ProjectDetailResponse>(`${this.apiUrl}/${id}`);
  }

  // Project Events
  getProjectEvents(id: number, filter?: string): Observable<CalendarEventResponse[]> {
    const params = filter ? { filter_type: filter } : undefined;
    return this.http.get<CalendarEventResponse[]>(`${this.apiUrl}/${id}/events`, { params });
  }

  // Project Notes
  getProjectNotes(id: number): Observable<ProjectNote[]> {
    return this.http.get<ProjectNote[]>(`${this.apiUrl}/${id}/notes`);
  }

  addProjectNote(id: number, content: string): Observable<ProjectNote> {
    return this.http.post<ProjectNote>(`${this.apiUrl}/${id}/notes`, { content });
  }

  updateProjectNote(projectId: number, noteId: number, content: string): Observable<ProjectNote> {
    return this.http.put<ProjectNote>(`${this.apiUrl}/${projectId}/notes/${noteId}`, { content });
  }

  deleteProjectNote(projectId: number, noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/notes/${noteId}`);
  }

  // Project Contacts
  getProjectContacts(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${projectId}/contacts`);
  }

  linkContactToProject(projectId: number, contactId: number, role?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/contacts/${contactId}`, { role });
  }

  unlinkContactFromProject(projectId: number, contactId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${projectId}/contacts/${contactId}`);
  }

  // Project Timeline
  getProjectTimeline(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/timeline`);
  }
}
