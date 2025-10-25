import { Injectable } from '@angular/core';
import { CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { WidgetConfig } from '../models/widget.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardLayoutService {
  private readonly GRID_COLUMNS = 12;
  private readonly GRID_GAP = 16; // pixels
  private readonly WIDGET_MIN_SIZE = { cols: 1, rows: 1 };
  private readonly WIDGET_MAX_SIZE = { cols: 12, rows: 10 };

  constructor() {}

  /**
   * Calcule la position en grille à partir des coordonnées de drag
   */
  calculateGridPosition(
    dragEvent: CdkDragDrop<any>,
    containerRect: DOMRect
  ): { col: number; row: number } {
    // Utiliser la position de drop réelle avec une meilleure précision
    const dropX = dragEvent.dropPoint.x - containerRect.left;
    const dropY = dragEvent.dropPoint.y - containerRect.top;
    
    // Convertir en position de grille avec une logique plus fluide
    const colWidth = this.getColumnWidth(containerRect.width);
    const rowHeight = this.getRowHeight();
    
    // Utiliser Math.round pour un positionnement plus naturel
    const col = Math.round(dropX / colWidth);
    const row = Math.round(dropY / rowHeight);
    
    console.log('CalculateGridPosition (Improved):', {
      dropX, dropY,
      colWidth, rowHeight,
      calculatedCol: col, calculatedRow: row,
      containerRect: { width: containerRect.width, height: containerRect.height }
    });
    
    return {
      col: Math.max(0, Math.min(col, this.GRID_COLUMNS - 1)),
      row: Math.max(0, row)
    };
  }

  /**
   * Vérifie si une position est libre
   */
  isPositionFree(
    position: { col: number; row: number },
    size: { cols: number; rows: number },
    widgets: WidgetConfig[],
    excludeWidgetId?: string
  ): boolean {
    const endCol = position.col + size.cols;
    const endRow = position.row + size.rows;

    // Vérifier les limites de la grille
    if (endCol > this.GRID_COLUMNS || position.col < 0 || position.row < 0) {
      return false;
    }

    // Vérifier les collisions avec les autres widgets
    return !widgets.some(widget => {
      if (excludeWidgetId && widget.id === excludeWidgetId) {
        return false;
      }

      const widgetEndCol = widget.position.col + widget.size.cols;
      const widgetEndRow = widget.position.row + widget.size.rows;

      // Détection de collision : vérifier si les rectangles se chevauchent
      const collision = !(endCol <= widget.position.col || 
                         position.col >= widgetEndCol || 
                         endRow <= widget.position.row || 
                         position.row >= widgetEndRow);

      if (collision) {
        console.log(`Collision détectée avec widget ${widget.id}:`, {
          newWidget: { position, size },
          existingWidget: { 
            position: widget.position, 
            size: widget.size 
          }
        });
      }

      return collision;
    });
  }

  /**
   * Trouve toutes les collisions pour une position donnée
   */
  findCollisions(
    position: { col: number; row: number },
    size: { cols: number; rows: number },
    widgets: WidgetConfig[],
    excludeWidgetId?: string
  ): WidgetConfig[] {
    const endCol = position.col + size.cols;
    const endRow = position.row + size.rows;

    return widgets.filter(widget => {
      if (excludeWidgetId && widget.id === excludeWidgetId) {
        return false;
      }

      const widgetEndCol = widget.position.col + widget.size.cols;
      const widgetEndRow = widget.position.row + widget.size.rows;

      return !(endCol <= widget.position.col || 
               position.col >= widgetEndCol || 
               endRow <= widget.position.row || 
               position.row >= widgetEndRow);
    });
  }

  /**
   * Trouve la position la plus proche libre avec une recherche optimisée
   */
  findNearestFreePosition(
    targetPosition: { col: number; row: number },
    size: { cols: number; rows: number },
    widgets: WidgetConfig[],
    excludeWidgetId?: string
  ): { col: number; row: number } {
    // Essayer la position cible d'abord
    if (this.isPositionFree(targetPosition, size, widgets, excludeWidgetId)) {
      return targetPosition;
    }

    // Chercher dans un rayon croissant avec une logique plus intelligente
    for (let radius = 1; radius <= 8; radius++) {
      const candidates: Array<{ pos: { col: number; row: number }, distance: number }> = [];
      
      // Générer toutes les positions candidates dans ce rayon
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Ne considérer que les positions sur le périmètre du rayon
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          const testPosition = {
            col: targetPosition.col + dx,
            row: targetPosition.row + dy
          };

          // Vérifier les limites
          if (testPosition.col < 0 || testPosition.row < 0) continue;
          if (testPosition.col + size.cols > this.GRID_COLUMNS) continue;

          if (this.isPositionFree(testPosition, size, widgets, excludeWidgetId)) {
            // Calculer la distance euclidienne pour un meilleur choix
            const distance = Math.sqrt(dx * dx + dy * dy);
            candidates.push({ pos: testPosition, distance });
          }
        }
      }
      
      // Si on a trouvé des candidats, retourner le plus proche
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.distance - b.distance);
        console.log(`Position libre trouvée à distance ${candidates[0].distance}:`, candidates[0].pos);
        return candidates[0].pos;
      }
    }

    // Si aucune position libre trouvée, retourner la position cible
    console.warn('Aucune position libre trouvée, utilisation de la position cible');
    return targetPosition;
  }

  /**
   * Valide et ajuste la taille d'un widget
   */
  validateSize(size: { cols: number; rows: number }): { cols: number; rows: number } {
    return {
      cols: Math.max(
        this.WIDGET_MIN_SIZE.cols,
        Math.min(size.cols, this.WIDGET_MAX_SIZE.cols)
      ),
      rows: Math.max(
        this.WIDGET_MIN_SIZE.rows,
        Math.min(size.rows, this.WIDGET_MAX_SIZE.rows)
      )
    };
  }

  /**
   * Calcule les styles CSS pour positionner un widget
   */
  getWidgetStyles(widget: WidgetConfig, containerWidth: number): any {
    const columnWidth = this.getColumnWidth(containerWidth);
    const rowHeight = this.getRowHeight();

    return {
      'grid-column': `${widget.position.col + 1} / span ${widget.size.cols}`,
      'grid-row': `${widget.position.row + 1} / span ${widget.size.rows}`,
      'width': `${widget.size.cols * columnWidth}px`,
      'height': `${widget.size.rows * rowHeight}px`
    };
  }

  /**
   * Calcule la largeur d'une colonne
   */
  private getColumnWidth(containerWidth: number): number {
    return (containerWidth - (this.GRID_COLUMNS - 1) * this.GRID_GAP) / this.GRID_COLUMNS;
  }

  /**
   * Calcule la hauteur d'une ligne
   */
  private getRowHeight(): number {
    return 200; // Hauteur fixe pour l'instant
  }

  /**
   * Génère les styles CSS pour la grille
   */
  getGridStyles(): any {
    return {
      'display': 'grid',
      'grid-template-columns': `repeat(${this.GRID_COLUMNS}, 1fr)`,
      'grid-auto-rows': '200px',
      'gap': `${this.GRID_GAP}px`,
      'padding': '0', // Supprimé pour permettre aux widgets de toucher les bords
      'min-height': '100vh'
    };
  }

  /**
   * Génère les styles CSS pour la grille avec lignes visibles
   */
  getGridStylesWithLines(): any {
    return {
      'display': 'grid',
      'grid-template-columns': `repeat(${this.GRID_COLUMNS}, 1fr)`,
      'grid-auto-rows': '200px',
      'gap': `${this.GRID_GAP}px`,
      'padding': '0', // Supprimé pour permettre aux widgets de toucher les bords
      'min-height': '100vh',
      'background-image': `
        linear-gradient(to right, rgba(0, 122, 204, 0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 122, 204, 0.1) 1px, transparent 1px)
      `,
      'background-size': `calc(100% / ${this.GRID_COLUMNS}) 200px`,
      'background-position': '0 0'
    };
  }

  /**
   * Calcule les dimensions optimales pour un nouveau widget
   */
  getOptimalSize(widgetType: string): { cols: number; rows: number } {
    const sizeMap: Record<string, { cols: number; rows: number }> = {
      'ticket-stats': { cols: 4, rows: 1 },
      'agent-stats': { cols: 4, rows: 1 },
      'chart': { cols: 6, rows: 2 },
      'todo': { cols: 4, rows: 2 },
      'quick-actions': { cols: 4, rows: 1 },
      'recent-activity': { cols: 8, rows: 2 }
    };

    return sizeMap[widgetType] || { cols: 4, rows: 1 };
  }

  /**
   * Optimise la disposition des widgets pour éviter les espaces vides
   */
  optimizeLayout(widgets: WidgetConfig[]): WidgetConfig[] {
    const sortedWidgets = [...widgets].sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.col - b.position.col;
    });

    const optimizedWidgets: WidgetConfig[] = [];
    let currentRow = 0;
    let currentCol = 0;

    for (const widget of sortedWidgets) {
      // Trouver la première position libre
      while (!this.isPositionFree(
        { col: currentCol, row: currentRow },
        widget.size,
        optimizedWidgets
      )) {
        currentCol += widget.size.cols;
        if (currentCol + widget.size.cols > this.GRID_COLUMNS) {
          currentCol = 0;
          currentRow += 1;
        }
      }

      optimizedWidgets.push({
        ...widget,
        position: { col: currentCol, row: currentRow }
      });

      currentCol += widget.size.cols;
      if (currentCol >= this.GRID_COLUMNS) {
        currentCol = 0;
        currentRow += 1;
      }
    }

    return optimizedWidgets;
  }
}
