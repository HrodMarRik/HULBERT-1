import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Project, ProjectContact, ProjectNote, ProjectTimelineItem, ProjectDetailResponse } from '../../../../models/project.model';
import { CalendarEvent } from '../../../../models/calendar.model';

export interface ProjectState {
  project: ProjectDetailResponse | null;
  events: CalendarEvent[];
  contacts: ProjectContact[];
  documents: any[];
  phases: any[];
  deliverables: any[];
  timeline: ProjectTimelineItem[];
  notes: ProjectNote[];
  companies: any[];
  activeTab: string;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  // State subjects
  private projectStateSubject = new BehaviorSubject<ProjectState>({
    project: null,
    events: [],
    contacts: [],
    documents: [],
    phases: [],
    deliverables: [],
    timeline: [],
    notes: [],
    companies: [],
    activeTab: 'overview',
    isLoading: false,
    error: null
  });

  // Public observables
  public projectState$ = this.projectStateSubject.asObservable();

  // Action subjects for component communication
  private loadProjectSubject = new Subject<number>();
  private updateProjectSubject = new Subject<{id: number, data: any}>();
  private addNoteSubject = new Subject<{projectId: number, content: string}>();
  private deleteNoteSubject = new Subject<{projectId: number, noteId: number}>();
  private setActiveTabSubject = new Subject<string>();

  public loadProject$ = this.loadProjectSubject.asObservable();
  public updateProject$ = this.updateProjectSubject.asObservable();
  public addNote$ = this.addNoteSubject.asObservable();
  public deleteNote$ = this.deleteNoteSubject.asObservable();
  public setActiveTab$ = this.setActiveTabSubject.asObservable();

  constructor() {}

  // State management methods
  getCurrentState(): ProjectState {
    return this.projectStateSubject.value;
  }

  setProject(project: ProjectDetailResponse): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      project,
      error: null
    });
  }

  setEvents(events: CalendarEvent[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      events
    });
  }

  setContacts(contacts: ProjectContact[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      contacts
    });
  }

  setDocuments(documents: any[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      documents
    });
  }

  setPhases(phases: any[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      phases
    });
  }

  setDeliverables(deliverables: any[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      deliverables
    });
  }

  setTimeline(timeline: ProjectTimelineItem[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      timeline
    });
  }

  setNotes(notes: ProjectNote[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      notes
    });
  }

  setCompanies(companies: any[]): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      companies
    });
  }

  setActiveTab(tab: string): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      activeTab: tab
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      isLoading: loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.getCurrentState();
    this.projectStateSubject.next({
      ...currentState,
      error
    });
  }

  // Action triggers
  triggerLoadProject(projectId: number): void {
    this.loadProjectSubject.next(projectId);
  }

  triggerUpdateProject(projectId: number, data: any): void {
    this.updateProjectSubject.next({ id: projectId, data });
  }

  triggerAddNote(projectId: number, content: string): void {
    this.addNoteSubject.next({ projectId, content });
  }

  triggerDeleteNote(projectId: number, noteId: number): void {
    this.deleteNoteSubject.next({ projectId, noteId });
  }

  triggerSetActiveTab(tab: string): void {
    this.setActiveTabSubject.next(tab);
  }

  // Utility methods
  addNote(note: ProjectNote): void {
    const currentState = this.getCurrentState();
    this.setNotes([...currentState.notes, note]);
  }

  removeNote(noteId: number): void {
    const currentState = this.getCurrentState();
    this.setNotes(currentState.notes.filter(note => note.id !== noteId));
  }

  updateProjectField(field: string, value: any): void {
    const currentState = this.getCurrentState();
    if (currentState.project) {
      const updatedProject = { ...currentState.project, [field]: value };
      this.setProject(updatedProject);
    }
  }

  // Computed properties
  getProject(): ProjectDetailResponse | null {
    return this.getCurrentState().project;
  }

  getEvents(): CalendarEvent[] {
    return this.getCurrentState().events;
  }

  getContacts(): ProjectContact[] {
    return this.getCurrentState().contacts;
  }

  getDocuments(): any[] {
    return this.getCurrentState().documents;
  }

  getPhases(): any[] {
    return this.getCurrentState().phases;
  }

  getDeliverables(): any[] {
    return this.getCurrentState().deliverables;
  }

  getTimeline(): ProjectTimelineItem[] {
    return this.getCurrentState().timeline;
  }

  getNotes(): ProjectNote[] {
    return this.getCurrentState().notes;
  }

  getCompanies(): any[] {
    return this.getCurrentState().companies;
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

  // Reset state
  resetState(): void {
    this.projectStateSubject.next({
      project: null,
      events: [],
      contacts: [],
      documents: [],
      phases: [],
      deliverables: [],
      timeline: [],
      notes: [],
      companies: [],
      activeTab: 'overview',
      isLoading: false,
      error: null
    });
  }
}
