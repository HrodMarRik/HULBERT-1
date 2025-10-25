import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, interval, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-tabs',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="admin-tabs-container">
      <div class="admin-tabs-header">
        <div class="tabs">
          <!-- Dashboard (Principal) -->
          <button class="tab-btn" 
                  [class.active]="isActiveTab('dashboard')" 
                  (click)="navigateToTab('dashboard')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13"/>
            </svg>
            Dashboard
          </button>
          
          <!-- Gestion Dropdown -->
          <div class="dropdown-container" 
               (mouseenter)="showDropdowns.gestion = true" 
               (mouseleave)="showDropdowns.gestion = false">
            <button class="tab-btn dropdown-btn" 
                    [class.active]="isActiveTab('calendar') || isActiveTab('domains') || isActiveTab('agents') || isActiveTab('tickets')"
                  (click)="navigateToTab('calendar')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
              Gestion
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
              </svg>
            </button>
            <div class="dropdown-menu" [class.show]="showDropdowns.gestion">
              <button class="dropdown-item" (click)="navigateToTab('calendar')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
            </svg>
            Agenda
          </button>
              <button class="dropdown-item" (click)="navigateToTab('domains')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
            Drive
          </button>
              <button class="dropdown-item" (click)="navigateToTab('agents')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            Agents
          </button>
              <button class="dropdown-item" (click)="navigateToTab('tickets')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Tickets
                <span *ngIf="ticketNotificationCount > 0" class="notification-badge-small">
              {{ ticketNotificationCount }}
            </span>
          </button>
            </div>
          </div>
          
          <!-- Business Dropdown -->
          <div class="dropdown-container" 
               (mouseenter)="showDropdowns.business = true" 
               (mouseleave)="showDropdowns.business = false">
            <button class="tab-btn dropdown-btn" 
                    [class.active]="isActiveTab('companies') || isActiveTab('contacts') || isActiveTab('projects') || isActiveTab('accounting')"
                    (click)="navigateToTab('companies')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
              </svg>
              Business
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
              </svg>
            </button>
            <div class="dropdown-menu" [class.show]="showDropdowns.business">
              <button class="dropdown-item" (click)="navigateToTab('companies')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
                Companies
              </button>
              <button class="dropdown-item" (click)="navigateToTab('contacts')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                </svg>
                Contacts
              </button>
              <button class="dropdown-item" (click)="navigateToTab('projects')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Projects
              </button>
              <button class="dropdown-item" (click)="navigateToTab('accounting')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13 12.5,13H11.5C10.04,13 9,13.9 9,15M6,20V4H18V20H6M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V4A2,2 0 0,0 18,2H6M12,5A2.5,2.5 0 0,1 14.5,7.5A2.5,2.5 0 0,1 12,10A2.5,2.5 0 0,1 9.5,7.5A2.5,2.5 0 0,1 12,5Z"/>
                </svg>
                Comptabilité
              </button>
          </div>
        </div>
        
          <!-- Communication Dropdown -->
          <div class="dropdown-container" 
               (mouseenter)="showDropdowns.communication = true" 
               (mouseleave)="showDropdowns.communication = false">
            <button class="tab-btn dropdown-btn" 
                    [class.active]="isActiveTab('rss-reader') || isActiveTab('email-security') || isActiveTab('email-campaigns')"
                    (click)="navigateToTab('rss-reader')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z"/>
              </svg>
              Communication
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
          </svg>
        </button>
            <div class="dropdown-menu" [class.show]="showDropdowns.communication">
              <button class="dropdown-item" (click)="navigateToTab('rss-reader')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.18,15.64A2.18,2.18 0 0,1 8.36,17.82C8.36,19 7.38,20 6.18,20C5,20 4,19 4,17.82A2.18,2.18 0 0,1 6.18,15.64M6.18,4A2.18,2.18 0 0,1 8.36,6.18C8.36,7.38 7.38,8.36 6.18,8.36C5,8.36 4,7.38 4,6.18A2.18,2.18 0 0,1 6.18,4M6.18,9.82A2.18,2.18 0 0,1 8.36,12C8.36,13.2 7.38,14.18 6.18,14.18C5,14.18 4,13.2 4,12A2.18,2.18 0 0,1 6.18,9.82M12,6.18A2.18,2.18 0 0,1 14.18,8.36C14.18,9.55 13.2,10.55 12,10.55C10.82,10.55 9.82,9.55 9.82,8.36A2.18,2.18 0 0,1 12,6.18M12,1A2.18,2.18 0 0,1 14.18,3.18C14.18,4.38 13.2,5.36 12,5.36C10.82,5.36 9.82,4.38 9.82,3.18A2.18,2.18 0 0,1 12,1M12,11.64A2.18,2.18 0 0,1 14.18,13.82C14.18,15 13.2,16 12,16C10.82,16 9.82,15 9.82,13.82A2.18,2.18 0 0,1 12,11.64M18,6.18A2.18,2.18 0 0,1 20.18,8.36C20.18,9.55 19.2,10.55 18,10.55C16.82,10.55 15.82,9.55 15.82,8.36A2.18,2.18 0 0,1 18,6.18M18,1A2.18,2.18 0 0,1 20.18,3.18C20.18,4.38 19.2,5.36 18,5.36C16.82,5.36 15.82,4.38 15.82,3.18A2.18,2.18 0 0,1 18,1M18,11.64A2.18,2.18 0 0,1 20.18,13.82C20.18,15 19.2,16 18,16C16.82,16 15.82,15 15.82,13.82A2.18,2.18 0 0,1 18,11.64Z"/>
          </svg>
                RSS Reader
        </button>
              <button class="dropdown-item" (click)="navigateToTab('email-security')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
          </svg>
          Email Security
        </button>
              <button class="dropdown-item" (click)="navigateToTab('email-campaigns')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z"/>
                </svg>
                Email Campaigns
              </button>
            </div>
          </div>
          
          <!-- Portfolio Dropdown -->
          <div class="dropdown-container" 
               (mouseenter)="showDropdowns.portfolio = true" 
               (mouseleave)="showDropdowns.portfolio = false">
            <button class="tab-btn dropdown-btn" 
                    [class.active]="isActiveTab('portfolio-management') || isActiveTab('portfolio-cms') || isActiveTab('wishlist')"
                (click)="navigateToTab('portfolio-management')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
          </svg>
              Portfolio
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
              </svg>
            </button>
            <div class="dropdown-menu" [class.show]="showDropdowns.portfolio">
              <button class="dropdown-item" (click)="navigateToTab('portfolio-management')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
                Gestion Portfolio
              </button>
              <button class="dropdown-item" (click)="navigateToTab('portfolio-cms')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                CMS Portfolio
              </button>
              <button class="dropdown-item" (click)="navigateToTab('wishlist')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
                </svg>
                Wishlist
              </button>
            </div>
          </div>
          
          <!-- Outils Dropdown -->
          <div class="dropdown-container" 
               (mouseenter)="showDropdowns.outils = true" 
               (mouseleave)="showDropdowns.outils = false">
            <button class="tab-btn dropdown-btn" 
                    [class.active]="isActiveTab('logs') || isActiveTab('diagrams') || isActiveTab('code-library') || isActiveTab('competitive-analysis')"
                    (click)="navigateToTab('logs')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,1 5.1,3C3.1,5 3.1,8 5.1,10C7,11.9 9.7,12.4 12,11.5L21.1,20.6C21.5,21 22.2,21 22.6,20.6C23,20.2 23,19.5 22.7,19M5.1,7C4.5,7 4,6.5 4,5.9C4,5.3 4.4,4.9 5,4.9C5.6,4.9 6.1,5.4 6.1,6C6.1,6.6 5.6,7 5.1,7Z"/>
              </svg>
              Outils
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
              </svg>
            </button>
            <div class="dropdown-menu" [class.show]="showDropdowns.outils">
              <button class="dropdown-item" (click)="navigateToTab('logs')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Logs
              </button>
              <button class="dropdown-item" (click)="navigateToTab('diagrams')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z"/>
                </svg>
                Diagrams
              </button>
              <button class="dropdown-item" (click)="navigateToTab('code-library')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Code Library
              </button>
              <button class="dropdown-item" (click)="navigateToTab('competitive-analysis')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
                Analyse Concurrentielle
              </button>
            </div>
          </div>
          
          <!-- Client Dropdown -->
          <div class="dropdown-container" 
               (mouseenter)="showDropdowns.client = true" 
               (mouseleave)="showDropdowns.client = false">
            <button class="tab-btn dropdown-btn" 
                    [class.active]="isActiveTab('client-portal') || isActiveTab('client-tokens')"
                    (click)="navigateToTab('client-portal')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
              Client
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="dropdown-arrow">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
              </svg>
            </button>
            <div class="dropdown-menu" [class.show]="showDropdowns.client">
              <button class="dropdown-item" (click)="navigateToTab('client-portal')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                Client Portal
              </button>
              <button class="dropdown-item" (click)="navigateToTab('client-tokens')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
                Client Tokens
        </button>
            </div>
          </div>
        </div>
        
        <div class="tab-actions">
          <button class="action-btn portfolio-btn" (click)="goToPortfolio()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Retour au Portfolio
          </button>
          <button class="action-btn" (click)="logout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
      <div class="tab-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-tabs-container {
      min-height: 100vh;
      background: #1a1a1a;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .admin-tabs-header {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 48px;
    }

    .tabs {
      display: flex;
      gap: 4px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: #888;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      border-radius: 6px 6px 0 0;
      position: relative;
    }

    .tab-btn:hover {
      background: #404040;
      color: #e0e0e0;
    }

    .tab-btn.active {
      background: #007acc;
      color: white;
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #007acc;
    }

    .tab-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn:hover {
      background: #505050;
      transform: translateY(-1px);
    }

    .portfolio-btn {
      background: #007acc;
      color: white;
    }

    .portfolio-btn:hover {
      background: #005a9e;
    }

    .tab-content {
      flex: 1;
      overflow: hidden;
    }

    .notification-badge {
      background: #f44336;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      margin-left: 6px;
      animation: pulse 2s infinite;
    }

    .notification-badge-small {
      background: #f44336;
      color: white;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: bold;
      margin-left: 4px;
      animation: pulse 2s infinite;
    }

    /* Dropdown Styles */
    .dropdown-container {
      position: relative;
    }

    .dropdown-btn {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dropdown-arrow {
      transition: transform 0.2s;
    }

    .dropdown-btn.active .dropdown-arrow {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      min-width: 160px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.15s ease-in-out;
    }

    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: #d1d5db;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
    }

    .dropdown-item:hover {
      background: #374151;
      color: #f3f4f6;
    }

    .dropdown-item:first-child {
      border-radius: 8px 8px 0 0;
    }

    .dropdown-item:last-child {
      border-radius: 0 0 8px 8px;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .admin-tabs-header {
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }
      
      .tabs {
        width: 100%;
        justify-content: center;
      }
      
      .tab-btn {
        flex: 1;
        justify-content: center;
        font-size: 12px;
        padding: 8px 12px;
      }
      
      .tab-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AdminTabsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  ticketNotificationCount = 0;
  showDropdowns = {
    gestion: false,
    business: false,
    communication: false,
    portfolio: false,
    outils: false,
    client: false
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.loadTicketNotifications();
    this.startNotificationRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startNotificationRefresh() {
    // Refresh notifications every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTicketNotifications();
      });
  }

  private loadTicketNotifications() {
    this.http.get<any>('http://localhost:8000/api/tickets/stats/summary')
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          console.error('Error loading ticket notifications:', error);
          return of({ unread_count: 0 });
        })
      )
      .subscribe({
        next: (stats: { unread_count?: number }) => {
          this.ticketNotificationCount = stats.unread_count || 0;
        }
      });
  }

  isActiveTab(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateToTab(route: string) {
    this.router.navigate(['/admin', route]);
  }

  logout() {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/admin-portal/login']);
  }

  goToPortfolio() {
    // Force recompilation
    this.router.navigate(['/']);
  }
}