import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'dev' | 'gaming';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('dev');
  public theme$: Observable<Theme> = this.themeSubject.asObservable();

  constructor() {
    // Load theme from localStorage or default to 'dev'
    const savedTheme = localStorage.getItem('portfolio-theme') as Theme;
    if (savedTheme && (savedTheme === 'dev' || savedTheme === 'gaming')) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('dev');
    }
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    localStorage.setItem('portfolio-theme', theme);
    this.applyThemeToBody(theme);
  }

  toggleTheme(): void {
    const newTheme = this.getCurrentTheme() === 'dev' ? 'gaming' : 'dev';
    this.setTheme(newTheme);
  }

  private applyThemeToBody(theme: Theme): void {
    document.body.className = '';
    document.body.classList.add(`${theme}-theme`);
  }
}
