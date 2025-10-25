import { Injectable } from '@angular/core';

export interface SessionState {
  currentPath: string;
  openFiles: Array<{
    path: string;
    content: string;
    modified: boolean;
    language: string;
  }>;
  activeFileIndex: number;
  history: string[];
  historyIndex: number;
  lastUpdated: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_KEY = 'file_manager_session';

  saveSession(state: Partial<SessionState>): void {
    const currentState = this.loadSession();
    const newState: SessionState = {
      ...currentState,
      ...state,
      lastUpdated: Date.now()
    };
    
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  loadSession(): SessionState {
    try {
      const saved = localStorage.getItem(this.SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Vérifier si la session n'est pas trop ancienne (24h)
        if (parsed.lastUpdated && (Date.now() - parsed.lastUpdated) < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load session:', error);
    }
    
    // Retourner l'état par défaut
    return {
      currentPath: '',
      openFiles: [],
      activeFileIndex: -1,
      history: [''],
      historyIndex: 0,
      lastUpdated: Date.now()
    };
  }

  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Méthodes utilitaires pour sauvegarder des parties spécifiques
  saveCurrentPath(path: string): void {
    this.saveSession({ currentPath: path });
  }

  saveOpenFiles(openFiles: any[], activeIndex: number): void {
    this.saveSession({ 
      openFiles: openFiles.map(file => ({
        path: file.path,
        content: file.content,
        modified: file.modified,
        language: file.language
      })),
      activeFileIndex: activeIndex
    });
  }

  saveHistory(history: string[], index: number): void {
    this.saveSession({ 
      history: [...history],
      historyIndex: index
    });
  }
}
