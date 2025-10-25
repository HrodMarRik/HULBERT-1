import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { WidgetConfig, DashboardConfig, WidgetCatalogItem, WidgetType } from '../models/widget.interface';

@Injectable({
  providedIn: 'root'
})
export class WidgetService {
  private readonly STORAGE_KEY_PREFIX = 'dashboardConfig_';
  private readonly API_BASE_URL = 'http://localhost:8000/api/dashboard';
  private readonly DEFAULT_CONFIG: DashboardConfig = {
    version: '1.0',
    widgets: [
      {
        id: 'widget-ticket-stats',
        type: 'ticket-stats',
        position: { col: 0, row: 0 },
        size: { cols: 4, rows: 1 },
        config: { refreshInterval: 30000 }
      },
      {
        id: 'widget-agent-stats',
        type: 'agent-stats',
        position: { col: 4, row: 0 },
        size: { cols: 4, rows: 1 },
        config: { refreshInterval: 30000 }
      },
      {
        id: 'widget-quick-actions',
        type: 'quick-actions',
        position: { col: 8, row: 0 },
        size: { cols: 4, rows: 1 },
        config: {}
      }
    ]
  };

  private widgetsSubject = new BehaviorSubject<WidgetConfig[]>([]);
  public widgets$ = this.widgetsSubject.asObservable();

  private readonly WIDGET_CATALOG: WidgetCatalogItem[] = [
    {
      type: 'ticket-stats',
      name: 'Statistiques Tickets',
      description: 'Affiche les statistiques des tickets par statut et priorité',
      icon: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z',
      defaultSize: { cols: 4, rows: 1 },
      category: 'stats'
    },
    {
      type: 'agent-stats',
      name: 'Statistiques Agents',
      description: 'Affiche les statistiques des agents et leur performance',
      icon: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z',
      defaultSize: { cols: 4, rows: 1 },
      category: 'stats'
    },
    {
      type: 'chart',
      name: 'Graphiques',
      description: 'Affiche des graphiques personnalisables',
      icon: 'M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13',
      defaultSize: { cols: 6, rows: 2 },
      category: 'charts'
    },
    {
      type: 'todo',
      name: 'Liste de Tâches',
      description: 'Gérez vos tâches personnelles',
      icon: 'M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z',
      defaultSize: { cols: 4, rows: 2 },
      category: 'personal'
    },
    {
      type: 'quick-actions',
      name: 'Actions Rapides',
      description: 'Accès rapide aux fonctions principales',
      icon: 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z',
      defaultSize: { cols: 4, rows: 1 },
      category: 'tools'
    },
    {
      type: 'recent-activity',
      name: 'Activité Récente',
      description: 'Timeline des dernières activités',
      icon: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z',
      defaultSize: { cols: 8, rows: 2 },
      category: 'tools'
    },
    {
      type: 'open-tickets',
      name: 'Tickets Ouverts',
      description: 'Liste des tickets ouverts avec détails',
      icon: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z',
      defaultSize: { cols: 6, rows: 2 },
      category: 'stats'
    }
  ];

  constructor(private http: HttpClient) {
    this.loadConfig();
  }

  getWidgetCatalog(): WidgetCatalogItem[] {
    return this.WIDGET_CATALOG;
  }

  getWidgetCategories(): string[] {
    const categories = new Set<string>();
    this.WIDGET_CATALOG.forEach(widget => {
      categories.add(widget.category);
    });
    return Array.from(categories);
  }

  getWidgetCatalogByCategory(category: string): WidgetCatalogItem[] {
    return this.WIDGET_CATALOG.filter(widget => widget.category === category);
  }

  getWidgetCatalogItem(type: WidgetType): WidgetCatalogItem | undefined {
    return this.WIDGET_CATALOG.find(widget => widget.type === type);
  }

  getCurrentWidgets(): WidgetConfig[] {
    return this.widgetsSubject.value;
  }

  addWidget(type: WidgetType): void {
    const catalogItem = this.getWidgetCatalogItem(type);
    if (!catalogItem) return;

    const newWidget: WidgetConfig = {
      id: `widget-${type}-${Date.now()}`,
      type,
      position: this.findNextAvailablePosition(catalogItem.defaultSize),
      size: catalogItem.defaultSize,
      config: {}
    };

    const currentWidgets = this.getCurrentWidgets();
    this.widgetsSubject.next([...currentWidgets, newWidget]);
    this.saveConfig();
  }

  removeWidget(widgetId: string): void {
    const currentWidgets = this.getCurrentWidgets();
    const filteredWidgets = currentWidgets.filter(widget => widget.id !== widgetId);
    this.widgetsSubject.next(filteredWidgets);
    this.saveConfig();
  }

  updateWidget(widgetId: string, updates: Partial<WidgetConfig>): void {
    const currentWidgets = this.getCurrentWidgets();
    const updatedWidgets = currentWidgets.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    this.widgetsSubject.next(updatedWidgets);
    this.saveConfig();
  }

  moveWidget(widgetId: string, newPosition: { col: number; row: number }): void {
    this.updateWidget(widgetId, { position: newPosition });
  }

  resizeWidget(widgetId: string, newSize: { cols: number; rows: number }): void {
    this.updateWidget(widgetId, { size: newSize });
  }

  resetToDefault(): void {
    this.widgetsSubject.next(this.DEFAULT_CONFIG.widgets);
    this.saveConfig();
  }

  private findNextAvailablePosition(size: { cols: number; rows: number }): { col: number; row: number } {
    const currentWidgets = this.getCurrentWidgets();
    const gridSize = 12; // 12 colonnes max
    const maxRows = 10; // Limite arbitraire pour les lignes

    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col <= gridSize - size.cols; col++) {
        const isOccupied = currentWidgets.some(widget => {
          const widgetEndCol = widget.position.col + widget.size.cols;
          const widgetEndRow = widget.position.row + widget.size.rows;
          const newEndCol = col + size.cols;
          const newEndRow = row + size.rows;

          return !(newEndCol <= widget.position.col || 
                  col >= widgetEndCol || 
                  newEndRow <= widget.position.row || 
                  row >= widgetEndRow);
        });

        if (!isOccupied) {
          return { col, row };
        }
      }
    }

    // Si aucune position libre, placer en bas
    return { col: 0, row: maxRows };
  }

  private loadConfig(): void {
    const userId = this.getCurrentUserId();
    const storageKey = `${this.STORAGE_KEY_PREFIX}${userId}`;
    const savedConfig = localStorage.getItem(storageKey);

    if (savedConfig) {
      try {
        const config: DashboardConfig = JSON.parse(savedConfig);
        this.widgetsSubject.next(config.widgets);
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        this.widgetsSubject.next(this.DEFAULT_CONFIG.widgets);
      }
    } else {
      this.widgetsSubject.next(this.DEFAULT_CONFIG.widgets);
    }
  }

  private saveConfig(): void {
    const userId = this.getCurrentUserId();
    const storageKey = `${this.STORAGE_KEY_PREFIX}${userId}`;
    const config: DashboardConfig = {
      version: '1.0',
      widgets: this.getCurrentWidgets()
    };

    localStorage.setItem(storageKey, JSON.stringify(config));
  }

  private getCurrentUserId(): string {
    // Pour l'instant, utiliser un ID fixe. Plus tard, récupérer depuis le service d'auth
    return 'user-1';
  }

  // Méthodes pour la sauvegarde serveur
  async saveConfigToServer(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const config = {
        config_json: {
          version: '1.0',
          widgets: this.getCurrentWidgets()
        }
      };

      await this.http.post(`${this.API_BASE_URL}/users/${userId}/config`, config).toPromise();
      console.log('Configuration sauvegardée sur le serveur');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde serveur:', error);
    }
  }

  async loadConfigFromServer(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const response = await this.http.get(`${this.API_BASE_URL}/users/${userId}/config`).toPromise() as any;
      
      if (response && response.config_json) {
        this.widgetsSubject.next(response.config_json.widgets || []);
        // Sauvegarder aussi en localStorage pour la synchronisation
        this.saveConfig();
      }
    } catch (error) {
      console.error('Erreur lors du chargement serveur:', error);
      // En cas d'erreur, utiliser la config locale
      this.loadConfig();
    }
  }
}