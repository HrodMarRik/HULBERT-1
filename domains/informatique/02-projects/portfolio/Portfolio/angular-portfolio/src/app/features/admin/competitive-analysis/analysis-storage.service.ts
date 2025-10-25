import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AnalysisResponse {
  questionId: string;
  answer: any;
  timestamp: Date;
}

export interface CompetitiveAnalysisReport {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'completed';
  currentStep: number;
  responses: AnalysisResponse[];
  metadata?: {
    sector?: string;
    marketSize?: number;
    mainCompetitor?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisStorageService {
  private readonly STORAGE_KEY = 'competitive_analyses';
  private readonly AUTO_SAVE_KEY = 'current_analysis_autosave';
  private apiUrl = 'http://localhost:8000/api/competitive-analysis';

  constructor(private http: HttpClient) {}

  // Local Storage Methods
  saveToLocalStorage(analysis: CompetitiveAnalysisReport): void {
    try {
      const analyses = this.getFromLocalStorage();
      const index = analyses.findIndex(a => a.id === analysis.id);
      
      if (index >= 0) {
        analyses[index] = analysis;
      } else {
        analyses.push(analysis);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(analyses));
      console.log('Analysis saved to localStorage:', analysis.id);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  getFromLocalStorage(): CompetitiveAnalysisReport[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const analyses = JSON.parse(data);
      // Convert date strings back to Date objects
      return analyses.map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
        responses: a.responses.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  getAnalysisById(id: string): CompetitiveAnalysisReport | null {
    const analyses = this.getFromLocalStorage();
    return analyses.find(a => a.id === id) || null;
  }

  deleteFromLocalStorage(id: string): void {
    try {
      const analyses = this.getFromLocalStorage();
      const filtered = analyses.filter(a => a.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log('Analysis deleted from localStorage:', id);
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }

  // Auto-save Methods
  autoSave(analysis: CompetitiveAnalysisReport): void {
    try {
      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(analysis));
      console.log('Auto-saved analysis:', analysis.id);
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  }

  getAutoSaved(): CompetitiveAnalysisReport | null {
    try {
      const data = localStorage.getItem(this.AUTO_SAVE_KEY);
      if (!data) return null;
      
      const analysis = JSON.parse(data);
      return {
        ...analysis,
        createdAt: new Date(analysis.createdAt),
        updatedAt: new Date(analysis.updatedAt),
        responses: analysis.responses.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error reading auto-save:', error);
      return null;
    }
  }

  clearAutoSave(): void {
    try {
      localStorage.removeItem(this.AUTO_SAVE_KEY);
      console.log('Auto-save cleared');
    } catch (error) {
      console.error('Error clearing auto-save:', error);
    }
  }

  // Backend API Methods
  saveToBackend(analysis: CompetitiveAnalysisReport): Observable<CompetitiveAnalysisReport> {
    if (analysis.id && analysis.id.startsWith('local-')) {
      // New analysis
      return this.http.post<CompetitiveAnalysisReport>(this.apiUrl, analysis).pipe(
        catchError(error => {
          console.error('Error saving to backend:', error);
          return of(analysis); // Fallback to local
        })
      );
    } else {
      // Update existing
      return this.http.put<CompetitiveAnalysisReport>(`${this.apiUrl}/${analysis.id}`, analysis).pipe(
        catchError(error => {
          console.error('Error updating backend:', error);
          return of(analysis); // Fallback to local
        })
      );
    }
  }

  getFromBackend(): Observable<CompetitiveAnalysisReport[]> {
    return this.http.get<CompetitiveAnalysisReport[]>(this.apiUrl).pipe(
      map(analyses => analyses.map(a => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
        responses: a.responses.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }))
      }))),
      catchError(error => {
        console.error('Error fetching from backend:', error);
        return of(this.getFromLocalStorage()); // Fallback to local
      })
    );
  }

  getBackendAnalysisById(id: string): Observable<CompetitiveAnalysisReport | null> {
    return this.http.get<CompetitiveAnalysisReport>(`${this.apiUrl}/${id}`).pipe(
      map(a => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
        responses: a.responses.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }))
      })),
      catchError(error => {
        console.error('Error fetching from backend:', error);
        return of(this.getAnalysisById(id)); // Fallback to local
      })
    );
  }

  deleteFromBackend(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting from backend:', error);
        return of(void 0);
      })
    );
  }

  // Unified Methods (try backend first, fallback to local)
  save(analysis: CompetitiveAnalysisReport): Observable<CompetitiveAnalysisReport> {
    // Always save to local storage immediately
    this.saveToLocalStorage(analysis);
    
    // Try to save to backend
    return this.saveToBackend(analysis);
  }

  getAll(): Observable<CompetitiveAnalysisReport[]> {
    return this.getFromBackend();
  }

  getById(id: string): Observable<CompetitiveAnalysisReport | null> {
    return this.getBackendAnalysisById(id);
  }

  delete(id: string): Observable<void> {
    // Delete from local storage
    this.deleteFromLocalStorage(id);
    
    // Try to delete from backend
    return this.deleteFromBackend(id);
  }

  // Export/Import Methods
  exportAnalysis(analysis: CompetitiveAnalysisReport): void {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `competitive-analysis-${analysis.title}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  importAnalysis(file: File): Promise<CompetitiveAnalysisReport> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const analysis = JSON.parse(e.target?.result as string);
          // Generate new ID for imported analysis
          analysis.id = `local-${Date.now()}`;
          analysis.createdAt = new Date();
          analysis.updatedAt = new Date();
          
          this.saveToLocalStorage(analysis);
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Duplicate Analysis
  duplicate(analysis: CompetitiveAnalysisReport): CompetitiveAnalysisReport {
    const duplicated: CompetitiveAnalysisReport = {
      ...analysis,
      id: `local-${Date.now()}`,
      title: `${analysis.title} (Copie)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };
    
    this.saveToLocalStorage(duplicated);
    return duplicated;
  }
}

