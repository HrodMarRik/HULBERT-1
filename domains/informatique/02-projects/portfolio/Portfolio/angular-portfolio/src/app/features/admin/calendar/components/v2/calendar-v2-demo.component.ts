import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventListComponent } from '../../../../../shared/components/event-list/event-list.component';
import { EventCapsuleComponent } from '../../../../../shared/components/event-capsule/event-capsule.component';
import { TicketCapsuleComponent } from '../../../../../shared/components/ticket-capsule/ticket-capsule.component';

@Component({
  selector: 'app-calendar-v2-demo',
  standalone: true,
  imports: [CommonModule, EventListComponent, EventCapsuleComponent, TicketCapsuleComponent],
  template: `
    <div class="demo-container">
      <h1>🎯 Démonstration Calendrier V2</h1>
      
      <div class="demo-section">
        <h2>📅 EventCapsuleComponent - Types d'événements</h2>
        <div class="capsules-demo">
          <app-event-capsule
            [event]="singleDayEvent"
            [type]="'single'"
            [compact]="false"
            [showTime]="true">
          </app-event-capsule>
          
          <app-event-capsule
            [event]="multiDayEventStart"
            [type]="'start'"
            [compact]="false"
            [showTime]="true">
          </app-event-capsule>
          
          <app-event-capsule
            [event]="multiDayEventEnd"
            [type]="'end'"
            [compact]="false"
            [showTime]="true">
          </app-event-capsule>
        </div>
      </div>

      <div class="demo-section">
        <h2>🎫 TicketCapsuleComponent</h2>
        <div class="capsules-demo">
          <app-ticket-capsule
            [ticket]="sampleTicket"
            [compact]="false">
          </app-ticket-capsule>
        </div>
      </div>

      <div class="demo-section">
        <h2>📋 EventListComponent - Groupement par date</h2>
        <app-event-list
          [events]="sampleEvents"
          [title]="'Événements de démonstration'"
          [showTime]="true"
          [showDate]="true"
          [groupBy]="'date'"
          [compact]="false"
          [showHeader]="true"
          [showActions]="true"
          [showAddButton]="true"
          [emptyMessage]="'Aucun événement'"
          (eventClick)="onEventClick($event)"
          (eventEdit)="onEventEdit($event)"
          (eventDelete)="onEventDelete($event)"
          (addEvent)="onAddEvent()">
        </app-event-list>
      </div>

      <div class="demo-section">
        <h2>📋 EventListComponent - Groupement par statut</h2>
        <app-event-list
          [events]="sampleEvents"
          [title]="'Événements par statut'"
          [showTime]="true"
          [showDate]="false"
          [groupBy]="'status'"
          [compact]="true"
          [showHeader]="true"
          [showActions]="false"
          [showAddButton]="false"
          (eventClick)="onEventClick($event)">
        </app-event-list>
      </div>

      <div class="demo-section">
        <h2>🔗 Liens de test</h2>
        <div class="test-links">
          <a href="/admin/calendar-v2" class="test-link">
            🚀 Calendrier V2 Complet
          </a>
          <a href="/admin/projects" class="test-link">
            📁 Projets (avec EventList intégré)
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      background: #0f172a;
      min-height: 100vh;
      color: #f1f5f9;
      overflow-y: auto;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 32px;
      text-align: center;
      background: linear-gradient(135deg, #3b82f6, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .demo-section {
      margin-bottom: 48px;
      padding: 24px;
      background: #1a1f2e;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .demo-section h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #e2e8f0;
    }

    .capsules-demo {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
    }

    .test-links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .test-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .test-link:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: 16px;
      }

      .demo-section {
        padding: 16px;
      }

      .test-links {
        flex-direction: column;
      }

      .test-link {
        justify-content: center;
      }
    }
  `]
})
export class CalendarV2DemoComponent implements OnInit {
  singleDayEvent: any;
  multiDayEventStart: any;
  multiDayEventEnd: any;
  sampleTicket: any;
  sampleEvents: any[] = [];

  ngOnInit(): void {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Événement d'un seul jour
    this.singleDayEvent = {
      id: 1,
      title: 'Réunion équipe',
      start_datetime: new Date('2025-10-23T14:00:00'),
      end_datetime: new Date('2025-10-23T15:30:00'),
      status: 'confirmed',
      category: 'work',
      location: 'Salle de conférence A',
      description: 'Réunion hebdomadaire de l\'équipe de développement'
    };

    // Événement multi-jours - début
    this.multiDayEventStart = {
      id: 2,
      title: 'Formation Angular',
      start_datetime: new Date('2025-10-25T09:00:00'),
      end_datetime: new Date('2025-10-27T17:00:00'),
      status: 'planned',
      category: 'training',
      location: 'Centre de formation',
      description: 'Formation intensive Angular 17'
    };

    // Événement multi-jours - fin (même événement)
    this.multiDayEventEnd = {
      ...this.multiDayEventStart,
      id: 2 // Même ID pour montrer que c'est le même événement
    };

    // Ticket de démonstration
    this.sampleTicket = {
      id: 1,
      title: 'Bug: Calendrier ne s\'affiche pas',
      status: 'open',
      priority: 'high',
      created_at: new Date('2025-10-22T10:30:00'),
      due_date: new Date('2025-10-25T18:00:00')
    };

    // Événements pour EventListComponent
    this.sampleEvents = [
      {
        id: 1,
        title: 'Réunion équipe',
        start_datetime: new Date('2025-10-23T14:00:00'),
        end_datetime: new Date('2025-10-23T15:30:00'),
        status: 'confirmed',
        category: 'work',
        type: 'single',
        displayDate: new Date('2025-10-23'),
        originalEvent: null
      },
      {
        id: 2,
        title: 'Formation Angular',
        start_datetime: new Date('2025-10-25T09:00:00'),
        end_datetime: new Date('2025-10-27T17:00:00'),
        status: 'planned',
        category: 'training',
        type: 'start',
        displayDate: new Date('2025-10-25'),
        originalEvent: null
      },
      {
        id: 2, // Même ID pour montrer la fin
        title: 'Formation Angular',
        start_datetime: new Date('2025-10-25T09:00:00'),
        end_datetime: new Date('2025-10-27T17:00:00'),
        status: 'planned',
        category: 'training',
        type: 'end',
        displayDate: new Date('2025-10-27'),
        originalEvent: null
      },
      {
        id: 3,
        title: 'Déjeuner client',
        start_datetime: new Date('2025-10-24T12:00:00'),
        end_datetime: new Date('2025-10-24T14:00:00'),
        status: 'confirmed',
        category: 'business',
        type: 'single',
        displayDate: new Date('2025-10-24'),
        originalEvent: null
      }
    ];
  }

  onEventClick(event: any): void {
    console.log('Event clicked:', event);
    alert(`Événement cliqué: ${event.title}`);
  }

  onEventEdit(event: any): void {
    console.log('Event edit:', event);
    alert(`Modifier l'événement: ${event.title}`);
  }

  onEventDelete(event: any): void {
    console.log('Event delete:', event);
    if (confirm(`Supprimer l'événement "${event.title}" ?`)) {
      alert('Événement supprimé !');
    }
  }

  onAddEvent(): void {
    console.log('Add event');
    alert('Créer un nouvel événement');
  }
}
