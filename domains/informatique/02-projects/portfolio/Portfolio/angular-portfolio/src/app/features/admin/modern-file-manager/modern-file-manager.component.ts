import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import * as Prism from 'prismjs';
import { SessionService } from '../../../core/services/session.service';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';

interface FileItem {
  name: string;
  isDir: boolean;
  path: string;
  expanded?: boolean;
  children?: FileItem[];
  loading?: boolean;
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  modified: boolean;
  active: boolean;
}

interface ArchiveItem {
  id: string;
  name: string;
  originalPath: string;
  size: number;
  compressionRatio: number;
  createdAt: Date;
}

@Component({
  selector: 'app-modern-file-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
        <div class="file-manager-container admin-page-container">

          <!-- Header avec navigation -->
          <div class="file-manager-header">
        <div class="navigation-controls">
          <button class="nav-btn" (click)="toggleSidebar()" [class.active]="sidebarVisible" title="Ouvrir/Fermer l'explorateur">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
            </svg>
          </button>
          <button class="nav-btn" (click)="goBack()" [disabled]="!canGoBack()" title="Précédent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button class="nav-btn" (click)="goForward()" [disabled]="!canGoForward()" title="Suivant">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
          <button class="nav-btn" (click)="goUp()" [disabled]="!canGoUp()" title="Dossier parent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5z"/>
            </svg>
          </button>
        </div>
        
        <!-- Fil d'Ariane -->
        <div class="breadcrumb">
          <span class="breadcrumb-item" (click)="navigateToPath('')" [class.active]="currentPath === ''">
            🏠 Accueil
          </span>
          <ng-container *ngFor="let item of breadcrumbs; let i = index">
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item" 
                  (click)="navigateToPath(item.path)"
                  [class.active]="i === breadcrumbs.length - 1">
              {{ item.name }}
            </span>
          </ng-container>
        </div>
        
        <div class="header-actions">
          <!-- Barre de recherche -->
          <div class="search-container">
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (focus)="showSearchResults = true"
              (blur)="onSearchBlur()"
              placeholder="Rechercher des fichiers..."
              class="search-input">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            
            <!-- Résultats de recherche -->
            <div class="search-results" *ngIf="showSearchResults && searchResults.length > 0">
              <div class="search-results-header">
                <span>{{ searchResults.length }} résultat(s) trouvé(s) - Affichage des 5 premiers</span>
              </div>
              <div class="search-result-item" 
                   *ngFor="let result of searchResults.slice(0, 5)" 
                   (click)="selectSearchResult(result)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path *ngIf="result.isDir" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                  <path *ngIf="!result.isDir" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <div class="result-info">
                  <span class="result-name">{{ result.name }}</span>
                  <span class="result-path">{{ result.path }}</span>
                </div>
                <span class="result-type">{{ result.isDir ? 'Dossier' : 'Fichier' }}</span>
              </div>
            </div>
          </div>
          
          <button class="action-btn" (click)="showCreateMenu = !showCreateMenu" title="Créer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button class="action-btn" (click)="showArchives()" title="Archives">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </button>
                 <button class="action-btn" (click)="refresh()" [disabled]="isRefreshing" title="Actualiser">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" [class.spinning]="isRefreshing">
                     <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                   </svg>
                 </button>
                 <button class="action-btn" (click)="debugTabs()" title="Déboguer les onglets">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                   </svg>
                 </button>
        </div>
      </div>

      <!-- Menu de création -->
      <div class="create-menu" *ngIf="showCreateMenu" (click)="$event.stopPropagation()">
        <div class="create-menu-item" (click)="createFile()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Nouveau fichier
        </div>
        <div class="create-menu-item" (click)="createFolder()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          Nouveau dossier
        </div>
      </div>

      <div class="file-manager-content">
        <!-- Sidebar avec arbre de fichiers -->
        <div class="sidebar" [class.hidden]="!sidebarVisible">
          <div class="sidebar-header">
            <h3>Explorateur</h3>
            <button class="collapse-btn" (click)="toggleSidebar()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
          <div class="file-tree">
            <div class="tree-item" 
                 *ngFor="let item of treeItems" 
                 [class.expanded]="item.expanded"
                 [class.loading]="item.loading">
              <div class="tree-item-content" 
                   (click)="toggleTreeItem(item)"
                   [style.padding-left.px]="getTreeIndent(item)">
                <span class="tree-icon">
                  <svg *ngIf="item.isDir" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                  </svg>
                  <svg *ngIf="!item.isDir" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </span>
                <span class="tree-name" (click)="selectTreeItem(item)">{{ item.name }}</span>
              </div>
              <div class="tree-children" *ngIf="item.children && item.expanded">
                <div class="tree-item" 
                     *ngFor="let child of item.children" 
                     [class.expanded]="child.expanded"
                     [class.loading]="child.loading">
                  <div class="tree-item-content" 
                       (click)="toggleTreeItem(child)"
                       [style.padding-left.px]="getTreeIndent(child)">
                    <span class="tree-icon">
                      <svg *ngIf="child.isDir" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                      </svg>
                      <svg *ngIf="!child.isDir" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </span>
                    <span class="tree-name" (click)="selectTreeItem(child)">{{ child.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Zone principale -->
        <div class="main-content">
          <!-- Onglets des fichiers ouverts -->
          <div class="file-tabs" *ngIf="openFiles.length > 0">
            <div class="tab" 
                 *ngFor="let file of openFiles; let i = index"
                 [class.active]="file.active"
                 [class.modified]="file.modified"
                 (click)="switchToFile(file)">
              <span class="tab-name">{{ file.name }}</span>
              <button class="tab-close" (click)="closeFile(file, $event)" title="Fermer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

           <!-- Liste des fichiers -->
           <div class="file-list" *ngIf="!showArchivesView && (!getActiveFile() || editorMinimized)">
            <div class="file-list-header">
              <h3>{{ getCurrentFolderName() }}</h3>
              <div class="view-controls">
                <button class="view-btn" [class.active]="viewMode === 'grid'" (click)="setViewMode('grid')" title="Vue grille">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"/>
                  </svg>
                </button>
                <button class="view-btn" [class.active]="viewMode === 'list'" (click)="setViewMode('list')" title="Vue liste">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="file-grid" [class.list-view]="viewMode === 'list'">
              <div class="file-item" 
                   *ngFor="let item of currentItems" 
                   (click)="item.isDir ? selectItem(item) : openFile(item)"
                   [class.selected]="selectedItem?.path === item.path"
                   [class.folder]="item.isDir">
                <div class="file-icon">
                  <svg *ngIf="item.isDir" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                  </svg>
                  <svg *ngIf="!item.isDir" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div class="file-info">
                  <div class="file-name">{{ item.name }}</div>
                  <div class="file-type" *ngIf="!item.isDir">{{ getFileType(item.name) }}</div>
                  <div class="file-type" *ngIf="item.isDir">Dossier</div>
                </div>
                <div class="file-actions" (click)="$event.stopPropagation()">
                  <button class="action-btn-small" (click)="deleteItem(item)" title="Supprimer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

           <!-- Éditeur de fichier -->
           <div class="file-editor" *ngIf="getActiveFile() && !editorMinimized">
            <div class="editor-header">
              <div class="editor-title">
                <span class="file-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </span>
                {{ getActiveFile()?.name }}
                <span class="modified-indicator" *ngIf="getActiveFile()?.modified">●</span>
              </div>
           <div class="editor-actions">
             <button class="action-btn" (click)="saveFile()" [disabled]="saving">
               {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
             </button>
             <button class="action-btn secondary" (click)="minimizeEditor()" title="Minimiser l'éditeur">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M19 13H5v-2h14v2z"/>
               </svg>
             </button>
             <button class="action-btn secondary" (click)="closeActiveFile()">Fermer</button>
           </div>
            </div>
            <div class="editor-content">
              <!-- Éditeur avec coloration syntaxique pour les fichiers de code -->
              <div *ngIf="isCodeFile(getActiveFile()!.name)" class="code-editor">
                <div class="code-header">
                  <span class="language-badge">{{ getLanguageFromExtension(getActiveFile()!.name) }}</span>
                </div>
                <div class="code-content">
                  <textarea 
                    [(ngModel)]="getActiveFile()!.content"
                    (ngModelChange)="onContentChange()"
                    class="code-textarea"
                    placeholder="Contenu du fichier...">
                  </textarea>
                </div>
              </div>
              
              <!-- Éditeur simple pour les autres fichiers -->
              <div *ngIf="!isCodeFile(getActiveFile()!.name)" class="simple-editor">
                <textarea 
                  [(ngModel)]="getActiveFile()!.content"
                  (ngModelChange)="onContentChange()"
                  placeholder="Contenu du fichier..."
                  class="file-textarea">
                </textarea>
              </div>
            </div>
            <div class="editor-status" *ngIf="message || error">
              <div class="status-message success" *ngIf="message">{{ message }}</div>
              <div class="status-message error" *ngIf="error">{{ error }}</div>
            </div>
          </div>

          <!-- Vue des archives -->
          <div class="archives-view" *ngIf="showArchivesView">
            <div class="archives-header">
              <h3>Archives</h3>
              <button class="action-btn secondary" (click)="closeArchives()">Fermer</button>
            </div>
            <div class="archives-content">
              <div class="archive-item" *ngFor="let archive of archives" (click)="openArchive(archive)">
                <div class="archive-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div class="archive-info">
                  <div class="archive-name">{{ archive.name }}</div>
                  <div class="archive-details">
                    <span>{{ archive.originalPath }}</span>
                    <span>{{ archive.size }} bytes</span>
                    <span>{{ archive.compressionRatio }}% compression</span>
                  </div>
                </div>
                <div class="archive-actions">
                  <button class="action-btn-small" (click)="restoreArchive(archive, $event)" title="Restaurer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                    </svg>
                  </button>
                  <button class="action-btn-small" (click)="deleteArchive(archive, $event)" title="Supprimer définitivement">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation pour les modifications non sauvegardées -->
    <div class="modal-overlay" *ngIf="showSaveModal" (click)="cancelClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Modifications non sauvegardées</h3>
        </div>
        <div class="modal-body">
          <p>Le fichier "{{ pendingCloseFile?.name }}" a été modifié. Voulez-vous sauvegarder les modifications ?</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" (click)="saveAndClose()">Sauvegarder</button>
          <button class="btn btn-secondary" (click)="discardAndClose()">Ignorer</button>
          <button class="btn btn-cancel" (click)="cancelClose()">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal de création de fichier -->
    <div class="modal-overlay" *ngIf="showCreateFileModal" (click)="cancelCreateFile()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Créer un nouveau fichier</h3>
        </div>
        <div class="modal-body">
          <input type="text" [(ngModel)]="newFileName" placeholder="Nom du fichier" class="modal-input">
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" (click)="confirmCreateFile()">Créer</button>
          <button class="btn btn-cancel" (click)="cancelCreateFile()">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal de création de dossier -->
    <div class="modal-overlay" *ngIf="showCreateFolderModal" (click)="cancelCreateFolder()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Créer un nouveau dossier</h3>
        </div>
        <div class="modal-body">
          <input type="text" [(ngModel)]="newFolderName" placeholder="Nom du dossier" class="modal-input">
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" (click)="confirmCreateFolder()">Créer</button>
          <button class="btn btn-cancel" (click)="cancelCreateFolder()">Annuler</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
           .file-manager-container {
             height: 100vh;
             background: #1a1a1a;
             color: #e0e0e0;
             display: flex;
             flex-direction: column;
             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
             overflow-y: auto;
             overflow-x: hidden;
           }


    .file-manager-header {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: 48px;
    }

    .navigation-controls {
      display: flex;
      gap: 4px;
    }

    .nav-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-btn:hover:not(:disabled) {
      background: #505050;
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-btn.active {
      background: #007acc;
      color: white;
    }

    .breadcrumb {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .breadcrumb-item {
      cursor: pointer !important;
      padding: 8px 16px !important;
      border-radius: 8px !important;
      transition: all 0.3s ease !important;
      color: #666 !important;
      text-decoration: none !important;
      font-weight: 500 !important;
      border: 2px solid #444 !important;
      background: rgba(68, 68, 68, 0.1) !important;
      display: inline-block !important;
      margin: 2px !important;
    }

    .breadcrumb-item:hover {
      background: #1a365d !important;
      color: #ffffff !important;
      text-decoration: none !important;
      border: 2px solid #ffffff !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 8px rgba(26, 54, 93, 0.4) !important;
    }

    .breadcrumb-item.active {
      color: #ffffff !important;
      font-weight: 700 !important;
      text-decoration: none !important;
      background: #1a365d !important;
      border: 2px solid #ffffff !important;
      box-shadow: 0 2px 4px rgba(26, 54, 93, 0.3) !important;
    }

    .breadcrumb-separator {
      color: #666;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn:hover {
      background: #505050;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .action-btn.secondary {
      background: #666;
    }

           .action-btn.secondary:hover {
             background: #777;
           }


    .file-manager-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 250px;
      background: #252525;
      border-right: 1px solid #404040;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    }

    .sidebar.hidden {
      width: 0;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 12px 16px;
      border-bottom: 1px solid #404040;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
    }

    .file-tree {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .tree-item {
      margin-bottom: 2px;
    }

    .tree-item-content {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tree-item-content:hover {
      background: #404040;
    }

    .tree-icon {
      display: flex;
      align-items: center;
      color: #888;
    }

    .tree-name {
      font-size: 13px;
      color: #e0e0e0;
    }

    .tree-children {
      margin-left: 16px;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .file-tabs {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      display: flex;
      overflow-x: auto;
    }

    .tab {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      border-right: 1px solid #555;
      min-width: 120px;
      position: relative;
    }

    .tab:hover {
      background: #505050;
    }

    .tab.active {
      background: #007acc;
      color: white;
    }

    .tab.modified .tab-name::after {
      content: '●';
      color: #ff6b6b;
      margin-left: 4px;
    }

    .tab-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tab-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      border-radius: 2px;
      opacity: 0.7;
    }

    .tab-close:hover {
      background: rgba(255, 255, 255, 0.1);
      opacity: 1;
    }

    .file-list {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .file-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .file-list-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .view-controls {
      display: flex;
      gap: 4px;
    }

    .view-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-btn:hover {
      background: #505050;
    }

    .view-btn.active {
      background: #007acc;
      color: white;
    }

    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }

    .file-grid.list-view {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .file-item {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-height: 140px;
      position: relative;
    }

    .file-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      border-radius: 12px 12px 0 0;
      transition: all 0.3s ease;
    }

    .file-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .file-item:hover::before {
      background: #007acc;
    }

    .file-item.folder {
      background: linear-gradient(135deg, #2d2d2d, #404040);
      border-color: #007acc;
    }

    .file-item.folder:hover {
      box-shadow: 0 8px 25px rgba(0, 122, 204, 0.3);
    }

    .file-item.selected {
      border-color: #007acc;
      background: #1e3a5f;
    }

    .file-icon {
      margin-bottom: 12px;
      color: #888;
    }

    .file-item.folder .file-icon {
      color: #007acc;
      font-size: 36px;
    }

    .file-name {
      font-weight: 500;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .file-item.folder .file-name {
      color: #007acc;
      font-weight: 600;
    }

    .file-type {
      font-size: 12px;
      color: #888;
    }

    .file-item.folder .file-type {
      color: #007acc;
    }

    .file-editor {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .editor-header {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .editor-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .modified-indicator {
      color: #ff6b6b;
      font-size: 16px;
    }

    .editor-actions {
      display: flex;
      gap: 8px;
    }

    .editor-content {
      flex: 1;
      padding: 16px;
    }

    .file-textarea {
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 16px;
      color: #e0e0e0;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      outline: none;
    }

    .file-textarea:focus {
      border-color: #007acc;
    }

    .editor-status {
      padding: 8px 16px;
      border-top: 1px solid #404040;
    }

    .status-message {
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 13px;
    }

    .status-message.success {
      background: #2d5a2d;
      color: #90ee90;
    }

    .status-message.error {
      background: #5a2d2d;
      color: #ff6b6b;
    }

    /* Menu de création */
    .create-menu {
      position: absolute;
      top: 60px;
      right: 16px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 8px 0;
      z-index: 100;
      min-width: 180px;
    }

    .create-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #e0e0e0;
    }

    .create-menu-item:hover {
      background: #404040;
    }

    /* Actions sur les fichiers */
    .file-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: all 0.2s ease;
    }

    .file-item:hover .file-actions {
      opacity: 1;
    }

    .action-btn-small {
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: #e0e0e0;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 4px;
    }

    .action-btn-small:hover {
      background: rgba(0, 0, 0, 0.9);
    }

    /* Vue des archives */
    .archives-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .archives-header {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .archives-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .archives-content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .archive-item {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .archive-item:hover {
      background: #404040;
      border-color: #007acc;
    }

    .archive-icon {
      color: #007acc;
    }

    .archive-info {
      flex: 1;
    }

    .archive-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .archive-details {
      font-size: 12px;
      color: #888;
      display: flex;
      gap: 16px;
    }

    .archive-actions {
      display: flex;
      gap: 8px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
    }

    .modal-header h3 {
      margin: 0 0 16px 0;
      color: #e0e0e0;
    }

    .modal-body p {
      margin: 0 0 24px 0;
      color: #ccc;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007acc;
      color: white;
    }

    .btn-primary:hover {
      background: #005a9e;
    }

    .btn-secondary {
      background: #666;
      color: white;
    }

    .btn-secondary:hover {
      background: #777;
    }

    .btn-cancel {
      background: #404040;
      color: #e0e0e0;
    }

    .btn-cancel:hover {
      background: #505050;
    }

    /* Input modal */
    .modal-input {
      width: 100%;
      background: #404040;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 8px 12px;
      color: #e0e0e0;
      font-size: 14px;
      outline: none;
    }

    .modal-input:focus {
      border-color: #007acc;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .file-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 200px;
      }
      
      .file-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }
      
      .file-item {
        min-height: 120px;
        padding: 12px;
      }
      
      .file-icon {
        font-size: 24px;
      }
      
      .file-item.folder .file-icon {
        font-size: 28px;
      }
    }

    @media (max-width: 480px) {
      .file-manager-header {
        flex-direction: column;
        gap: 8px;
        padding: 8px;
      }
      
      .sidebar {
        width: 100%;
        height: 200px;
      }
      
      .file-manager-content {
        flex-direction: column;
      }
      
      .file-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 8px;
      }
      
      .file-item {
        min-height: 100px;
        padding: 8px;
      }
    }

    /* Styles pour l'éditeur de code avec coloration syntaxique */
    .code-editor {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .code-header {
      background: #2d2d2d;
      padding: 8px 12px;
      border-bottom: 1px solid #404040;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .language-badge {
      background: #007acc;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .code-content {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .code-content pre {
      margin: 0;
      padding: 16px;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      overflow: auto;
      height: 100%;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .code-content code {
      background: none;
      padding: 0;
      font-family: inherit;
      font-size: inherit;
      color: inherit;
    }

    .code-textarea {
      width: 100%;
      height: 100%;
      background: #1e1e1e;
      border: none;
      color: #d4d4d4;
      caret-color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      padding: 16px;
      resize: none;
      outline: none;
    }

    /* Styles Prism.js pour la coloration syntaxique */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #6a9955;
    }

    .token.punctuation {
      color: #d4d4d4;
    }

    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #b5cea8;
    }

    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #ce9178;
    }

    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #d4d4d4;
    }

    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #569cd6;
    }

    .token.function,
    .token.class-name {
      color: #dcdcaa;
    }

    .token.regex,
    .token.important,
    .token.variable {
      color: #d16969;
    }

    .token.important,
    .token.bold {
      font-weight: bold;
    }

    .token.italic {
      font-style: italic;
    }

    .token.entity {
      cursor: help;
    }

    /* Styles pour la barre de recherche */
    .search-container {
      position: relative;
      display: flex;
      align-items: center;
      background: #404040;
      border-radius: 6px;
      padding: 8px 12px;
      min-width: 300px;
      border: 2px solid transparent;
      transition: border-color 0.2s ease;
    }

    .search-container:focus-within {
      border-color: #007acc;
    }

    .search-input {
      background: none;
      border: none;
      color: #e0e0e0;
      font-size: 14px;
      outline: none;
      flex: 1;
      padding-right: 8px;
    }

    .search-input::placeholder {
      color: #888;
    }

    .search-icon {
      color: #888;
      flex-shrink: 0;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      max-height: 400px;
      overflow-y: auto;
      margin-top: 4px;
    }

    .search-results-header {
      padding: 8px 12px;
      background: #404040;
      border-bottom: 1px solid #555;
      font-size: 12px;
      color: #888;
      font-weight: 500;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #333;
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .search-result-item:hover {
      background: #404040;
    }

    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .result-name {
      font-weight: 500;
      color: #e0e0e0;
      font-size: 14px;
    }

    .result-path {
      font-size: 11px;
      color: #888;
    }

    .result-type {
      font-size: 11px;
      color: #007acc;
      background: rgba(0, 122, 204, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }

           .file-editor .editor-content {
             height: calc(100% - 40px);
           }

           .file-editor .code-content pre {
             height: calc(100% - 80px);
           }

           .file-editor .code-textarea {
             height: calc(100% - 80px);
           }
  `]
})
export class ModernFileManagerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Navigation
  currentPath = '';
  history: string[] = [];
  historyIndex = -1;
  breadcrumbs: BreadcrumbItem[] = [];
  
  // File system
  treeItems: FileItem[] = [];
  currentItems: FileItem[] = [];
  selectedItem: FileItem | null = null;
  
  // File management
  openFiles: OpenFile[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  
  // Editor
  saving = false;
  message = '';
  error = '';
  
  // Modal
  showSaveModal = false;
  pendingCloseFile: OpenFile | null = null;
  
  // Sidebar
  sidebarVisible = true;
  
  // Creation
  showCreateMenu = false;
  showCreateFileModal = false;
  showCreateFolderModal = false;
  newFileName = '';
  newFolderName = '';
  
  // Archives
  showArchivesView = false;
  archives: ArchiveItem[] = [];
  
  // Barre de recherche
  searchQuery = '';
  searchResults: FileItem[] = [];
  showSearchResults = false;
  allFiles: FileItem[] = [];
  
  // Gestion de l'état et de la mise à jour
  isRefreshing = false;
  lastRefreshTime = 0;
  refreshInterval = 30000; // 30 secondes
  activeFileIndex = -1;
  private highlightCache: Map<string, string> = new Map();
  
           // Mode d'affichage des fichiers
           editorFullscreen = false; // Toujours afficher la navbar
           editorMinimized = false; // État de minimisation de l'éditeur

  constructor(private http: HttpClient, private sessionService: SessionService) {}

  ngOnInit() {
    console.log('ModernFileManagerComponent initialized');
    console.log('Current access token:', localStorage.getItem('accessToken'));
    
    // Restaurer l'état de la session
    this.restoreSession();
    
    this.loadTree();
    this.loadCurrentPath();
    
    // Démarrer la mise à jour automatique en arrière-plan
    this.startBackgroundRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.highlightCache.clear();
  }

  // Fonction de débogage pour voir l'état des onglets
  debugTabs() {
    console.log('=== DEBUG ONGLETS ===');
    console.log('Nombre d\'onglets ouverts:', this.openFiles.length);
    console.log('Index du fichier actif:', this.activeFileIndex);
    console.log('Mode plein écran:', this.editorFullscreen);
    console.log('Fichiers ouverts:', this.openFiles.map(f => ({ name: f.name, active: f.active, path: f.path })));
    console.log('Fichier actif:', this.getActiveFile()?.name);
    console.log('==================');
  }

  // Gestion de session
  restoreSession() {
    const session = this.sessionService.loadSession();
    
    if (session.currentPath) {
      this.currentPath = session.currentPath;
      this.updateBreadcrumbs();
    }
    
    if (session.history && session.history.length > 0) {
      this.history = [...session.history];
      this.historyIndex = session.historyIndex;
    }
    
    if (session.openFiles && session.openFiles.length > 0) {
      // Restaurer les fichiers ouverts
      this.openFiles = session.openFiles.map((file, index) => ({
        path: file.path,
        content: file.content,
        modified: file.modified,
        language: file.language,
        name: file.path.split(/[\\/]/).pop() || file.path,
        originalContent: file.content,
        active: index === session.activeFileIndex
      }));
      
      if (session.activeFileIndex >= 0 && session.activeFileIndex < this.openFiles.length) {
        this.activeFileIndex = session.activeFileIndex;
      }
    }
    
    console.log('Session restored:', session);
  }

  saveSession() {
    this.sessionService.saveCurrentPath(this.currentPath);
    
    // Calculer l'index du fichier actif
    const activeIndex = this.openFiles.findIndex(f => f.active);
    this.sessionService.saveOpenFiles(this.openFiles, activeIndex);
    this.sessionService.saveHistory(this.history, this.historyIndex);
  }

  // Mise à jour en arrière-plan
  startBackgroundRefresh() {
    setInterval(() => {
      if (!this.isRefreshing) {
        this.backgroundRefresh();
      }
    }, this.refreshInterval);
  }

  backgroundRefresh() {
    this.isRefreshing = true;
    this.lastRefreshTime = Date.now();
    
    // Mettre à jour l'arbre et le chemin actuel en arrière-plan
    this.loadTree(true);
    this.loadCurrentPath(true);
    
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  // Navigation methods
  navigateToPath(path: string) {
    if (path === this.currentPath) return;
    
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.currentPath);
    this.historyIndex++;
    this.currentPath = path;
    this.updateBreadcrumbs();
    this.loadCurrentPath();
    
    // Sauvegarder l'état
    this.saveSession();
  }

  goBack() {
    if (this.canGoBack()) {
      this.historyIndex--;
      this.currentPath = this.history[this.historyIndex];
      this.updateBreadcrumbs();
      this.loadCurrentPath();
      this.saveSession();
    }
  }

  goForward() {
    if (this.canGoForward()) {
      this.historyIndex++;
      this.currentPath = this.history[this.historyIndex];
      this.updateBreadcrumbs();
      this.loadCurrentPath();
      this.saveSession();
    }
  }

  goUp() {
    if (this.canGoUp()) {
      const pathParts = this.currentPath.split('/').filter(p => p);
      pathParts.pop();
      this.navigateToPath(pathParts.join('/'));
    }
  }

  canGoBack(): boolean {
    return this.historyIndex > 0;
  }

  canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  canGoUp(): boolean {
    return this.currentPath !== '';
  }

  updateBreadcrumbs() {
    this.breadcrumbs = [];
    if (this.currentPath) {
      // Gérer les deux types de séparateurs (Windows \ et Unix /)
      const parts = this.currentPath.split(/[/\\]/).filter(p => p);
      let currentPath = '';
      for (const part of parts) {
        currentPath += (currentPath ? '/' : '') + part;
        this.breadcrumbs.push({
          name: part,
          path: currentPath
        });
      }
    }
  }

  // File system methods
  loadTree(silent: boolean = false) {
    if (!silent) console.log('Loading tree...');
    this.http.get<any>('http://localhost:8000/api/domains-v2/tree').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        if (!silent) console.log('Tree data received:', data);
        this.treeItems = data.items || [];
        if (!silent) console.log('Tree items set:', this.treeItems);
      },
      error: (error: any) => {
        if (!silent) {
          console.error('Error loading tree:', error);
          this.error = 'Erreur lors du chargement de l\'arbre';
        }
      }
    });
  }

  loadCurrentPath(silent: boolean = false) {
    if (!silent) console.log('Loading current path:', this.currentPath);
    const url = this.currentPath ? `http://localhost:8000/api/domains-v2/tree?path=${encodeURIComponent(this.currentPath)}` : 'http://localhost:8000/api/domains-v2/tree';
    if (!silent) console.log('API URL:', url);
    this.http.get<any>(url).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        if (!silent) console.log('Current path data received:', data);
        this.currentItems = data.items || [];
        if (!silent) console.log('Current items set:', this.currentItems);
        this.selectedItem = null;
      },
      error: (error: any) => {
        if (!silent) {
          console.error('Error loading path:', error);
          this.error = 'Erreur lors du chargement du dossier';
        }
      }
    });
  }

  selectItem(item: FileItem) {
    this.selectedItem = item;
    if (item.isDir) {
      this.navigateToPath(item.path);
    } else {
      this.openFile(item);
    }
  }

  selectTreeItem(item: FileItem) {
    if (item.isDir) {
      this.navigateToPath(item.path);
    } else {
      this.openFile(item);
    }
  }

  toggleTreeItem(item: FileItem) {
    if (!item.isDir) return;
    
    if (item.expanded) {
      item.expanded = false;
    } else {
      item.loading = true;
      this.http.get<any>(`http://localhost:8000/api/domains-v2/tree?path=${encodeURIComponent(item.path)}`).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (data: any) => {
          item.children = data.items || [];
          item.expanded = true;
          item.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading children:', error);
          item.loading = false;
        }
      });
    }
  }

  // File management methods
  openFile(item: FileItem) {
    // Check if file is already open
    const existingFile = this.openFiles.find(f => f.path === item.path);
    if (existingFile) {
      this.switchToFile(existingFile);
      return;
    }

    // Load file content
    this.http.get<any>(`http://localhost:8000/api/domains-v2/file?path=${encodeURIComponent(item.path)}`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        const newFile: OpenFile = {
          path: item.path,
          name: item.name,
          content: data.content || '',
          originalContent: data.content || '',
          modified: false,
          active: true
        };

        // Deactivate other files
        this.openFiles.forEach(f => f.active = false);
        
        // Add new file
        this.openFiles.push(newFile);
        this.activeFileIndex = this.openFiles.length - 1;
        
        console.log('File opened successfully:', newFile.name);
        console.log('Total open files:', this.openFiles.length);
        console.log('Active file index:', this.activeFileIndex);
        
                 // Garder la navbar visible
                 this.editorFullscreen = false;
        
        // Sauvegarder l'état
        this.saveSession();
      },
      error: (error: any) => {
        console.error('Error loading file:', error);
        this.error = 'Erreur lors du chargement du fichier';
      }
    });
  }

           switchToFile(file: OpenFile) {
             // Si le fichier est déjà actif, le minimiser
             if (file.active && !this.editorMinimized) {
               this.minimizeEditor();
               return;
             }
             
             this.openFiles.forEach(f => f.active = false);
             file.active = true;
             // Maximiser l'éditeur quand on clique sur un onglet
             this.editorMinimized = false;
             this.saveSession();
             console.log('Fichier activé:', file.name, '- Éditeur maximisé');
           }

  closeFile(file: OpenFile, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (file.modified) {
      this.pendingCloseFile = file;
      this.showSaveModal = true;
    } else {
      this.performCloseFile(file);
    }
  }

  closeActiveFile() {
    const activeFile = this.getActiveFile();
    if (activeFile) {
      this.closeFile(activeFile);
    }
  }

  performCloseFile(file: OpenFile) {
    const index = this.openFiles.indexOf(file);
    if (index > -1) {
      this.openFiles.splice(index, 1);
      
      // If we closed the active file, activate another one
      if (file.active && this.openFiles.length > 0) {
        const newActiveIndex = Math.min(index, this.openFiles.length - 1);
        this.openFiles[newActiveIndex].active = true;
      }
    }
    
    // Sauvegarder l'état
    this.saveSession();
  }

  getActiveFile(): OpenFile | undefined {
    return this.openFiles.find(f => f.active);
  }

  onContentChange() {
    const activeFile = this.getActiveFile();
    if (activeFile) {
      activeFile.modified = activeFile.content !== activeFile.originalContent;
    }
  }

  saveFile() {
    const activeFile = this.getActiveFile();
    if (!activeFile) return;

    this.saving = true;
    this.error = '';
    this.message = '';

    const payload = {
      path: activeFile.path,
      content: activeFile.content
    };

    this.http.post<any>('http://localhost:8000/api/domains-v2/file', payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        activeFile.originalContent = activeFile.content;
        activeFile.modified = false;
        this.saving = false;
        this.message = 'Fichier sauvegardé avec succès';
        setTimeout(() => this.message = '', 3000);
      },
      error: (error: any) => {
        console.error('Error saving file:', error);
        this.saving = false;
        this.error = 'Erreur lors de la sauvegarde';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  // Modal methods
  saveAndClose() {
    if (this.pendingCloseFile) {
      this.saveFile();
      this.performCloseFile(this.pendingCloseFile);
      this.showSaveModal = false;
      this.pendingCloseFile = null;
    }
  }

  discardAndClose() {
    if (this.pendingCloseFile) {
      this.performCloseFile(this.pendingCloseFile);
      this.showSaveModal = false;
      this.pendingCloseFile = null;
    }
  }

  cancelClose() {
    this.showSaveModal = false;
    this.pendingCloseFile = null;
  }

  // Sidebar methods
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
  
  // Creation methods
  createFile() {
    this.showCreateMenu = false;
    this.showCreateFileModal = true;
    this.newFileName = '';
  }
  
  createFolder() {
    this.showCreateMenu = false;
    this.showCreateFolderModal = true;
    this.newFolderName = '';
  }
  
  confirmCreateFile() {
    if (!this.newFileName.trim()) return;
    
    const payload = {
      path: this.currentPath ? `${this.currentPath}/${this.newFileName}` : this.newFileName,
      content: ''
    };
    
    this.http.post<any>('http://localhost:8000/api/domains-v2/file', payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showCreateFileModal = false;
        this.newFileName = '';
        this.loadCurrentPath();
        this.message = 'Fichier créé avec succès';
        setTimeout(() => this.message = '', 3000);
      },
      error: (error: any) => {
        console.error('Error creating file:', error);
        this.error = 'Erreur lors de la création du fichier';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
  
  confirmCreateFolder() {
    if (!this.newFolderName.trim()) return;
    
    const payload = {
      path: this.currentPath ? `${this.currentPath}/${this.newFolderName}` : this.newFolderName,
      isDir: true
    };
    
    this.http.post<any>('http://localhost:8000/api/domains-v2/folder', payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showCreateFolderModal = false;
        this.newFolderName = '';
        this.loadCurrentPath();
        this.message = 'Dossier créé avec succès';
        setTimeout(() => this.message = '', 3000);
      },
      error: (error: any) => {
        console.error('Error creating folder:', error);
        this.error = 'Erreur lors de la création du dossier';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
  
  cancelCreateFile() {
    this.showCreateFileModal = false;
    this.newFileName = '';
  }
  
  cancelCreateFolder() {
    this.showCreateFolderModal = false;
    this.newFolderName = '';
  }
  
  // Deletion methods
  deleteItem(item: FileItem) {
    const payload = {
      path: item.path,
      archive: true
    };
    
    this.http.delete<any>('http://localhost:8000/api/domains-v2/delete', { body: payload }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadCurrentPath();
        this.message = `${item.isDir ? 'Dossier' : 'Fichier'} archivé avec succès`;
        setTimeout(() => this.message = '', 3000);
      },
      error: (error: any) => {
        console.error('Error deleting item:', error);
        this.error = 'Erreur lors de la suppression';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
  
  // Archive methods
  showArchives() {
    this.showArchivesView = true;
    this.loadArchives();
  }
  
  closeArchives() {
    this.showArchivesView = false;
  }
  
  loadArchives() {
    this.http.get<any>('http://localhost:8000/api/domains-v2/archives').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        this.archives = data.archives || [];
      },
      error: (error: any) => {
        console.error('Error loading archives:', error);
        this.error = 'Erreur lors du chargement des archives';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
  
  openArchive(archive: ArchiveItem) {
    // Implementation for opening archive content
    console.log('Opening archive:', archive);
  }
  
  restoreArchive(archive: ArchiveItem, event: Event) {
    event.stopPropagation();
    
    this.http.post<any>('http://localhost:8000/api/domains-v2/restore', { archiveId: archive.id }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadArchives();
        this.loadCurrentPath();
        this.message = 'Archive restaurée avec succès';
        setTimeout(() => this.message = '', 3000);
      },
      error: (error: any) => {
        console.error('Error restoring archive:', error);
        this.error = 'Erreur lors de la restauration';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
  
  deleteArchive(archive: ArchiveItem, event: Event) {
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette archive ?')) {
      this.http.delete<any>(`http://localhost:8000/api/domains-v2/archives/${archive.id}`).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadArchives();
          this.message = 'Archive supprimée définitivement';
          setTimeout(() => this.message = '', 3000);
        },
        error: (error: any) => {
          console.error('Error deleting archive:', error);
          this.error = 'Erreur lors de la suppression définitive';
          setTimeout(() => this.error = '', 5000);
        }
      });
    }
  }

  // Minimiser l'éditeur (garder les onglets visibles)
  minimizeEditor() {
    this.editorMinimized = true;
    this.saveSession();
    console.log('Éditeur minimisé, affichage de la liste des fichiers');
  }

  // Maximiser l'éditeur
  maximizeEditor() {
    this.editorMinimized = false;
    this.saveSession();
    console.log('Éditeur maximisé');
  }

  // Obtenir l'icône d'un fichier
  getFileIcon(file: OpenFile): string {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '📄',
      'ts': '📄',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'json': '📋',
      'md': '📝',
      'py': '🐍',
      'php': '🐘',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'sql': '🗄️',
      'xml': '📄',
      'yaml': '📄',
      'yml': '📄',
      'txt': '📄'
    };
    return iconMap[ext || ''] || '📄';
  }

  // Méthodes pour les onglets
  toggleFullscreenMode() {
    this.editorFullscreen = !this.editorFullscreen;
    this.saveSession();
  }

  closeAllFiles() {
    if (this.openFiles.some(f => f.modified)) {
      if (confirm('Certains fichiers ont des modifications non sauvegardées. Voulez-vous vraiment fermer tous les fichiers ?')) {
        this.openFiles = [];
        this.editorFullscreen = false;
        this.saveSession();
      }
    } else {
      this.openFiles = [];
      this.editorFullscreen = false;
      this.saveSession();
    }
  }


  // Utility methods
  refresh() {
    // Utiliser la mise à jour en arrière-plan au lieu de recharger la page
    this.backgroundRefresh();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  getCurrentFolderName(): string {
    if (this.currentPath === '') return '.';
    const parts = this.currentPath.split('/');
    return parts[parts.length - 1] || '.';
  }

  getTreeIndent(item: FileItem): number {
    return 16; // Simplified for now
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: { [key: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'md': 'Markdown',
      'txt': 'Texte',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'sql': 'SQL',
      'xml': 'XML',
      'yml': 'YAML',
      'yaml': 'YAML'
    };
    return types[ext || ''] || 'Fichier';
  }

  getLanguageFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    return languageMap[ext || ''] || 'text';
  }

  highlightCode(content: string, language: string): string {
    // Créer une clé de cache basée sur le contenu et le langage
    const cacheKey = `${language}:${content.substring(0, 100)}`;
    
    // Vérifier le cache d'abord
    if (this.highlightCache.has(cacheKey)) {
      return this.highlightCache.get(cacheKey)!;
    }
    
    try {
      // Vérifier si le langage existe dans Prism
      if (!Prism.languages[language]) {
        console.warn(`Language ${language} not found in Prism, using text`);
        language = 'text';
      }
      
      // Vérifier à nouveau après le changement
      if (!Prism.languages[language]) {
        console.warn(`Language ${language} still not found, returning raw content`);
        this.highlightCache.set(cacheKey, content);
        return content;
      }
      
      const highlighted = Prism.highlight(content, Prism.languages[language], language);
      this.highlightCache.set(cacheKey, highlighted);
      return highlighted;
    } catch (error) {
      console.warn('Error highlighting code:', error);
      this.highlightCache.set(cacheKey, content);
      return content;
    }
  }

  isCodeFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    const codeExtensions = ['js', 'ts', 'html', 'css', 'scss', 'json', 'md', 'py', 'php', 'java', 'cpp', 'c', 'rb', 'go', 'rs', 'sql', 'xml', 'yaml', 'yml', 'txt'];
    return codeExtensions.includes(ext || '');
  }


  // Méthodes pour la recherche
  onSearchInput() {
    console.log('Search input:', this.searchQuery);
    
    if (this.searchQuery.length < 1) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    console.log('Searching for:', query);
    
    // Utiliser la nouvelle API de recherche
    this.http.get<any>(`http://localhost:8000/api/domains-v2/search?q=${encodeURIComponent(query)}&limit=5`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        console.log('Search API response:', data);
        this.searchResults = data.results || [];
        console.log('Search results:', this.searchResults.length);
        this.showSearchResults = this.searchResults.length > 0;
      },
      error: (error: any) => {
        console.error('Search API error:', error);
        this.searchResults = [];
        this.showSearchResults = false;
      }
    });
  }

  onSearchBlur() {
    // Délai pour permettre le clic sur les résultats
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  selectSearchResult(result: FileItem) {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    
    if (result.isDir) {
      this.navigateToPath(result.path);
    } else {
      this.openFile(result);
    }
  }
}