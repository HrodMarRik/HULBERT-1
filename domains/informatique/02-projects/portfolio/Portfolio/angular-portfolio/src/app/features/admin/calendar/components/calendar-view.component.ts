import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CalendarStateService, CalendarViewState } from '../services/calendar-state.service';
import { CalendarEventResponse } from '../../../../models/calendar.model';
import { CalendarEventCardComponent } from './calendar-event-card.component';
import { CalendarWeekViewComponent } from './calendar-week-view.component';
import { CalendarDayViewComponent } from './calendar-day-view.component';

export interface DayRightClickEvent {
  date: Date;
  time?: string;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, CalendarEventCardComponent, CalendarWeekViewComponent, CalendarDayViewComponent],
  template: `
    <div class="calendar-view-container">
      <!-- Navigation Header -->
      <div class="calendar-header">
        <div class="navigation">
          <button class="nav-btn" (click)="previousPeriod()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>
            </svg>
          </button>
          
          <div class="current-period">
            <h2>{{ getCurrentPeriodTitle() }}</h2>
            <button class="today-btn" (click)="goToToday()">Today</button>
          </div>
          
          <button class="nav-btn" (click)="nextPeriod()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
            </svg>
          </button>
        </div>

        <!-- View Toggle -->
        <div class="view-toggle">
          <button 
            class="view-btn" 
            [class.active]="viewState.currentView === 'month'" 
            (click)="setView('month')">
            Month
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewState.currentView === 'week'" 
            (click)="setView('week')">
            Week
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewState.currentView === 'day'" 
            (click)="setView('day')">
            Day
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewState.currentView === 'list'" 
            (click)="setView('list')">
            List
          </button>
        </div>
      </div>

      <!-- Calendar Content -->
      <div class="calendar-content">
        <!-- Month View -->
        <div *ngIf="viewState.currentView === 'month'" class="month-view">
          <div class="calendar-grid">
            <!-- Days of week header -->
            <div class="days-header">
              <div class="day-header" *ngFor="let day of daysOfWeek">{{ day }}</div>
            </div>
            
            <!-- Calendar days -->
            <div class="calendar-days">
              <div 
                *ngFor="let day of calendarDays" 
                class="calendar-day"
                [class.other-month]="!day.isCurrentMonth"
                [class.today]="day.isToday"
                (click)="onDayClick(day.date)"
                (contextmenu)="onDayRightClick({date: day.date})">
                
                <div class="day-number">{{ day.date.getDate() }}</div>
                
                <!-- Event count badge -->
                <div class="event-count-badge" *ngIf="day.events.length > 0" title="Événements">
                  {{ day.events.length }}
                </div>
                
                <!-- Ticket count badge -->
                <div class="ticket-count-badge" *ngIf="day.tickets.length > 0" title="Tickets">
                  {{ day.tickets.length }}
                </div>
                
                <!-- Log count badge -->
                <div class="log-count-badge" *ngIf="day.logs.length > 0" title="Logs">
                  {{ day.logs.length }}
                </div>
                
                <div class="day-events">
                  <app-calendar-event-card
                    *ngFor="let event of day.events"
                    [event]="event"
                    [compact]="true"
                    [showDetails]="false"
                    [showActions]="false"
                    [class.event-starts-here]="isEventStartingOnDay(event, day.date)"
                    [class.event-ends-here]="isEventEndingOnDay(event, day.date)"
                    (eventClick)="onEventClick($event)"
                    (contextmenu)="onEventEditClick(event, $event)">
                  </app-calendar-event-card>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Week View -->
        <app-calendar-week-view 
          *ngIf="viewState.currentView === 'week'"
          [weekDays]="weekDays"
          [timeSlots]="timeSlots"
          (eventClick)="onEventClick($event)"
          (eventEditClick)="onEventEdit($event)"
          (dayClick)="onDayClick($event)"
          (dayRightClick)="onDayRightClick($event)"
          (ticketClick)="onTicketClick($event)"
          (logClick)="onLogClick($event)">
        </app-calendar-week-view>

        <!-- Day View -->
        <app-calendar-day-view
          *ngIf="viewState.currentView === 'day'"
          [currentDate]="viewState.currentDate"
          [dayEvents]="dayEvents"
          [dayTickets]="dayTickets"
          [dayLogs]="dayLogs"
          [timeSlots]="timeSlots"
          (eventClick)="onEventClick($event)"
          (eventEditClick)="onEventEdit($event)"
          (ticketClick)="onTicketClick($event)"
          (logClick)="onLogClick($event)"
          (dayRightClick)="onDayRightClick($event)"
          (addEvent)="onAddEvent()">
        </app-calendar-day-view>

        <!-- List View -->
        <div *ngIf="viewState.currentView === 'list'" class="list-view">
          <div class="events-list">
            <app-calendar-event-card
              *ngFor="let event of filteredEvents"
              [event]="event"
              [showDetails]="true"
              (eventClick)="onEventClick($event)"
              (eventEdit)="onEventEdit($event)"
              (eventDelete)="onEventDelete($event)">
            </app-calendar-event-card>
            
            <div *ngIf="filteredEvents.length === 0" class="no-events">
              <div class="no-events-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                </svg>
              </div>
              <h3>Aucun événement trouvé</h3>
              <p>Essayez d'ajuster vos filtres ou d'ajouter un nouvel événement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-view-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
      height: 100vh;
      min-height: 0;
    }

    /* Calendar Header */
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #333;
    }

    .navigation {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .nav-btn:hover {
      background: #4b5563;
      border-color: #6b7280;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .current-period {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .current-period h2 {
      margin: 0;
      color: #f3f4f6;
      font-size: 24px;
      font-weight: 600;
    }

    .today-btn {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .today-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .view-toggle {
      display: flex;
      background: #2d2d2d;
      border-radius: 8px;
      padding: 4px;
      border: 1px solid #404040;
    }

    .view-btn {
      padding: 10px 18px;
      background: transparent;
      color: #999;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      font-weight: 500;
    }

    .view-btn:hover {
      background: #404040;
      color: #f3f4f6;
      transform: translateY(-1px);
    }

    .view-btn.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    /* Calendar Content */
    .calendar-content {
      flex: 1;
      overflow-y: scroll;
      overflow-x: hidden;
      min-height: 0;
    }

    /* Month View */
    .month-view {
      height: 100%;
      overflow-y: auto;
    }

    .calendar-grid {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .days-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    }

    .day-header {
      padding: 12px;
      text-align: center;
      font-weight: 600;
      color: #9ca3af;
      font-size: 14px;
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
    }

    .calendar-day {
      border-right: 1px solid #333;
      border-bottom: 1px solid #333;
      padding: 12px;
      min-height: 140px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .calendar-day:hover {
      background: #2d2d2d;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .calendar-day.other-month {
      background: #1a1a1a;
      color: #374151;
      opacity: 0.3;
    }

    .calendar-day.today {
      background: rgba(59, 130, 246, 0.1);
    }

    .day-number {
      font-weight: 600;
      margin-bottom: 4px;
      color: #f3f4f6;
    }

    .day-events {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .event-count-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      border: 2px solid #1a1a1a;
    }

    .ticket-count-badge {
      position: absolute;
      top: 6px;
      right: 32px;
      background: #f59e0b;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      border: 2px solid #1a1a1a;
    }

    .log-count-badge {
      position: absolute;
      top: 6px;
      right: 58px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      border: 2px solid #1a1a1a;
    }

    /* Week View */
    .week-view {
      height: 100%;
      overflow-y: scroll;
    }

    .week-grid {
      display: flex;
      height: 100%;
      min-height: 2000px;
    }

    .time-column {
      width: 60px;
      background: #2d2d2d;
      border-right: 1px solid #404040;
      height: 100%;
    }

    .time-slot {
      min-height: 60px;
      padding: 12px 8px;
      font-size: 13px;
      color: #9ca3af;
      border-bottom: 1px solid #333;
      display: flex;
      align-items: flex-start;
      font-weight: 500;
      position: relative;
    }

    .time-slot::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #333;
    }

    .days-column {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .week-days-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    }

    .week-day-header {
      padding: 16px 12px;
      text-align: center;
      border-right: 1px solid #333;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .week-day-header:hover {
      background: #2d2d2d;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .day-name {
      font-weight: 600;
      color: #9ca3af;
      font-size: 14px;
    }

    .day-date {
      font-size: 18px;
      font-weight: 700;
      color: #f3f4f6;
      margin-top: 4px;
    }

    .week-days-content {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      min-height: 0;
      overflow-y: scroll;
    }

    .week-day {
      border-right: 1px solid #333;
      padding: 0;
      min-height: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .week-day:hover {
      background: rgba(45, 45, 45, 0.3);
    }

    .week-day-timeline {
      position: relative;
      height: 2000px;
      min-height: 2000px;
      cursor: context-menu;
      transition: background-color 0.2s ease;
    }

    .week-day-timeline:hover {
      background: rgba(59, 130, 246, 0.05);
    }

    .week-event-item {
      position: absolute;
      left: 4px;
      right: 4px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 20;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      font-size: 12px;
      margin: 1px 0;
      min-height: 20px;
      opacity: 1;
      visibility: visible;
    }

    .week-event-item:hover {
      background: #374151;
      border-color: #6b7280;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateY(-1px);
    }

    .week-event-item .event-time {
      font-size: 10px;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .week-event-item .event-title {
      font-size: 11px;
      font-weight: 600;
      color: #f3f4f6;
      line-height: 1.2;
    }

    /* Day View */
    .day-view {
      height: 100%;
      overflow-y: scroll;
    }

    .day-grid {
      display: flex;
      height: 100%;
      min-height: 2000px;
    }

    .day-column {
      flex: 1;
      padding: 16px;
      min-height: 0;
      position: relative;
    }

    .day-timeline {
      position: relative;
      height: 2000px; /* 24 heures * 60px */
      min-height: 2000px;
      cursor: context-menu;
      transition: background-color 0.2s ease;
    }

    .day-timeline:hover {
      background: rgba(59, 130, 246, 0.05);
    }

    .time-slots-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
    }

    .time-slot-bg {
      height: 60px;
      border-bottom: 1px solid #333;
      background: rgba(255, 255, 255, 0.01);
    }

    .time-slot-bg:nth-child(even) {
      background: rgba(255, 255, 255, 0.03);
    }

    .time-slot-bg:nth-child(4n) {
      border-bottom: 2px solid #404040;
    }

    .day-event-item {
      position: absolute;
      left: 8px;
      right: 8px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 20;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
      margin: 2px 0;
      min-height: 30px;
      opacity: 1;
      visibility: visible;
    }

    .day-event-item:hover {
      background: #374151;
      border-color: #6b7280;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
    }

    .day-event-item .event-time {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .day-event-item .event-title {
      font-size: 14px;
      font-weight: 600;
      color: #f3f4f6;
      margin-bottom: 4px;
    }

    .day-event-item .event-description {
      font-size: 13px;
      color: #d1d5db;
      line-height: 1.4;
    }

    .day-ticket-item {
      position: absolute;
      left: 8px;
      right: 8px;
      background: #f59e0b;
      border: 1px solid #d97706;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin: 1px 0;
    }

    .day-ticket-item:hover {
      background: #d97706;
      border-color: #b45309;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      transform: translateY(-1px);
    }

    .day-ticket-item .ticket-time {
      font-size: 11px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .day-ticket-item .ticket-title {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      line-height: 1.2;
    }

    .day-log-item {
      position: absolute;
      left: 8px;
      right: 8px;
      background: #10b981;
      border: 1px solid #059669;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin: 1px 0;
    }

    .day-log-item:hover {
      background: #059669;
      border-color: #047857;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      transform: translateY(-1px);
    }

    .day-log-item .log-time {
      font-size: 11px;
      color: #064e3b;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .day-log-item .log-title {
      font-size: 12px;
      font-weight: 600;
      color: #064e3b;
      line-height: 1.2;
    }

    .no-events-day {
      text-align: center;
      padding: 60px 24px;
      color: #9ca3af;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      background: rgba(26, 26, 26, 0.8);
      border-radius: 12px;
      border: 1px solid #333;
      backdrop-filter: blur(10px);
    }

    .no-events-day .no-events-icon {
      margin-bottom: 20px;
      opacity: 0.6;
    }

    .no-events-day h3 {
      margin: 0 0 12px 0;
      color: #d1d5db;
      font-size: 20px;
      font-weight: 600;
    }

    .no-events-day p {
      margin: 0;
      font-size: 15px;
      color: #9ca3af;
    }

    /* List View */
    .list-view {
      padding: 24px;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .no-events {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
    }

    .no-events-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-events h3 {
      margin: 0 0 8px 0;
      color: #d1d5db;
      font-size: 18px;
    }

    .no-events p {
      margin: 0;
      font-size: 14px;
    }

    /* Custom Scrollbar Styles */
    .calendar-content::-webkit-scrollbar,
    .week-days-content::-webkit-scrollbar,
    .week-view::-webkit-scrollbar,
    .day-view::-webkit-scrollbar {
      width: 16px;
    }

    .calendar-content::-webkit-scrollbar-track,
    .week-days-content::-webkit-scrollbar-track,
    .week-view::-webkit-scrollbar-track,
    .day-view::-webkit-scrollbar-track {
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
    }

    .calendar-content::-webkit-scrollbar-thumb,
    .week-days-content::-webkit-scrollbar-thumb,
    .week-view::-webkit-scrollbar-thumb,
    .day-view::-webkit-scrollbar-thumb {
      background: #4b5563;
      border-radius: 8px;
      border: 2px solid #2d2d2d;
      min-height: 40px;
    }

    .calendar-content::-webkit-scrollbar-thumb:hover,
    .week-days-content::-webkit-scrollbar-thumb:hover,
    .week-view::-webkit-scrollbar-thumb:hover,
    .day-view::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }

    .calendar-content::-webkit-scrollbar-corner,
    .week-days-content::-webkit-scrollbar-corner,
    .week-view::-webkit-scrollbar-corner,
    .day-view::-webkit-scrollbar-corner {
      background: #2d2d2d;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .calendar-header {
        flex-direction: column;
        gap: 16px;
        padding: 12px;
      }

      .navigation {
        width: 100%;
        justify-content: space-between;
      }

      .view-toggle {
        width: 100%;
        justify-content: center;
      }

      .calendar-day {
        min-height: 80px;
        padding: 4px;
      }

      .week-days-content {
        overflow-x: auto;
      }

      .week-day {
        min-width: 200px;
      }
    }

    /* Indicateurs pour événements multi-jours dans MONTH */
    :host ::ng-deep .event-starts-here::before {
      content: '→';
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: bold;
      color: #10b981;
      font-size: 14px;
      z-index: 10;
    }

    :host ::ng-deep .event-ends-here::before {
      content: '←';
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: bold;
      color: #f59e0b;
      font-size: 14px;
      z-index: 10;
    }

    :host ::ng-deep .event-starts-here {
      border-left: 3px solid #10b981 !important;
    }

    :host ::ng-deep .event-ends-here {
      border-right: 3px solid #f59e0b !important;
    }
  `]
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  @Output() eventClick = new EventEmitter<CalendarEventResponse>();
  @Output() eventEdit = new EventEmitter<CalendarEventResponse>();
  @Output() eventDelete = new EventEmitter<CalendarEventResponse>();
  @Output() dayClick = new EventEmitter<Date>();
  @Output() dayRightClick = new EventEmitter<DayRightClickEvent>();

  private destroy$ = new Subject<void>();
  viewState!: CalendarViewState;
  events: CalendarEventResponse[] = [];
  tickets: any[] = [];
  logs: any[] = [];
  filteredEvents: CalendarEventResponse[] = [];
  
  // Calendar data
  calendarDays: any[] = [];
  weekDays: any[] = [];
  dayEvents: CalendarEventResponse[] = [];
  dayTickets: any[] = [];
  dayLogs: any[] = [];
  
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  timeSlots = Array.from({ length: 24 }, (_, i) => i);

  constructor(private calendarStateService: CalendarStateService) {}

  ngOnInit(): void {
    // Initialize filteredEvents
    this.filteredEvents = [];
    
    // Subscribe to view state changes
    this.calendarStateService.viewState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.viewState = state;
        this.generateCalendarData();
      });

    // Subscribe to events changes
    this.calendarStateService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.events = events;
        this.generateCalendarData();
      });

    // Subscribe to tickets changes
    this.calendarStateService.tickets$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        this.tickets = tickets;
        this.generateCalendarData();
      });

    // Subscribe to logs changes
    this.calendarStateService.logs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.logs = logs;
        this.generateCalendarData();
      });

    // Subscribe to refresh calendar
    this.calendarStateService.refreshCalendar$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateCalendarData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateCalendarData(): void {
    console.log('generateCalendarData called with viewState:', this.viewState);
    console.log('Current events:', this.events);
    if (!this.viewState) return;

    switch (this.viewState.currentView) {
      case 'month':
        this.generateMonthView();
        break;
      case 'week':
        this.generateWeekView();
        break;
      case 'day':
        this.generateDayView();
        break;
      case 'list':
        this.generateListView();
        break;
    }
  }

  generateMonthView(): void {
    const currentDate = this.viewState.currentDate;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = this.getEventsForDate(date);
      const dayTickets = this.getTicketsForDate(date);
      const dayLogs = this.getLogsForDate(date);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isToday(date);
      
      this.calendarDays.push({
        date,
        events: dayEvents,
        tickets: dayTickets,
        logs: dayLogs,
        isCurrentMonth,
        isToday
      });
    }
  }

  generateWeekView(): void {
    console.log('=== generateWeekView called ===');
    const currentDate = this.viewState.currentDate;
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    this.weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = this.getEventsForDate(date);
      const dayTickets = this.getTicketsForDate(date);
      const dayLogs = this.getLogsForDate(date);
      
      console.log(`Week day ${i} (${date.toDateString()}):`, {
        date,
        events: dayEvents,
        tickets: dayTickets,
        logs: dayLogs
      });
      
      this.weekDays.push({
        date,
        name: this.daysOfWeek[i],
        events: dayEvents,
        tickets: dayTickets,
        logs: dayLogs
      });
    }
    
    console.log('Week days generated:', this.weekDays);
  }

  generateDayView(): void {
    console.log('=== generateDayView called ===');
    const currentDate = this.viewState.currentDate;
    this.dayEvents = this.getEventsForDate(currentDate);
    this.dayTickets = this.getTicketsForDate(currentDate);
    this.dayLogs = this.getLogsForDate(currentDate);
    
    console.log('Day view generated for:', currentDate.toDateString(), {
      events: this.dayEvents,
      tickets: this.dayTickets,
      logs: this.dayLogs
    });
  }

  generateListView(): void {
    // Use all events for list view
    this.filteredEvents = this.events;
  }

  getEventsForDate(date: Date): CalendarEventResponse[] {
    console.log('getEventsForDate called for date:', date);
    console.log('Available events:', this.events);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Début du jour cible
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1); // Début du jour suivant
    
    const filteredEvents = this.events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime || event.start_datetime);
      
      // Normaliser les dates d'événement (sans heures)
      const eventStartDate = new Date(eventStart);
      eventStartDate.setHours(0, 0, 0, 0);
      const eventEndDate = new Date(eventEnd);
      eventEndDate.setHours(0, 0, 0, 0);
      
      // Afficher l'événement seulement :
      // 1. Le jour où il commence
      // 2. Le jour où il finit (si différent du jour de début)
      const startsOnTargetDay = eventStartDate.getTime() === targetDate.getTime();
      const endsOnTargetDay = eventEndDate.getTime() === targetDate.getTime();
      
      // Pour les événements d'un seul jour, vérifier si c'est le même jour
      const isSingleDayEvent = eventStartDate.getTime() === eventEndDate.getTime();
      
      const isMatch = startsOnTargetDay || (endsOnTargetDay && !isSingleDayEvent);
      
      console.log(`Event ${event.title} (${eventStart.toDateString()} → ${eventEnd.toDateString()}) matches ${date.toDateString()}:`, isMatch);
      
      return isMatch;
    });
    
    // Validation et correction des événements avant de les retourner
    const validatedEvents = this.validateEvents(filteredEvents);
    
    console.log('Filtered events for date:', validatedEvents);
    return validatedEvents;
  }

  isEventStartingOnDay(event: CalendarEventResponse, date: Date): boolean {
    const eventStart = new Date(event.start_datetime);
    const targetDate = new Date(date);
    eventStart.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    return eventStart.getTime() === targetDate.getTime();
  }

  isEventEndingOnDay(event: CalendarEventResponse, date: Date): boolean {
    const eventEnd = new Date(event.end_datetime || event.start_datetime);
    const targetDate = new Date(date);
    eventEnd.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    return eventEnd.getTime() === targetDate.getTime();
  }

  private validateEvents(events: CalendarEventResponse[]): CalendarEventResponse[] {
    return events.map(event => {
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime || event.start_datetime);
      
      // Créer une copie de l'événement pour éviter de modifier l'original
      const validatedEvent = { ...event };
      
      // Vérifier si l'événement finit avant de commencer
      if (endDate < startDate) {
        console.warn(`⚠️ Événement invalide détecté dans getEventsForDate (ID: ${event.id}):`, {
          title: event.title,
          start: event.start_datetime,
          end: event.end_datetime,
          problem: 'L\'événement finit avant de commencer'
        });
        
        // Corriger automatiquement
        const correctedEnd = new Date(startDate.getTime() + (60 * 60 * 1000)); // +1 heure
        validatedEvent.end_datetime = correctedEnd;
        
        console.log(`✅ Événement corrigé dans getEventsForDate (ID: ${event.id})`);
      }
      
      // Vérifier si l'événement a une durée négative ou nulle
      const duration = endDate.getTime() - startDate.getTime();
      if (duration <= 0) {
        console.warn(`⚠️ Événement sans durée dans getEventsForDate (ID: ${event.id}):`, {
          title: event.title,
          duration_minutes: duration / (1000 * 60)
        });
        
        // Corriger en ajoutant 30 minutes minimum
        const correctedEnd = new Date(startDate.getTime() + (30 * 60 * 1000)); // +30 minutes
        validatedEvent.end_datetime = correctedEnd;
        
        console.log(`✅ Durée corrigée dans getEventsForDate (ID: ${event.id})`);
      }
      
      return validatedEvent;
    });
  }

  getTicketsForDate(date: Date): any[] {
    return this.tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate.toDateString() === date.toDateString();
    });
  }

  getLogsForDate(date: Date): any[] {
    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === date.toDateString();
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  formatTime(date: Date | string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventTopPosition(event: CalendarEventResponse): number {
    const eventDate = new Date(event.start_datetime);
    const hour = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    
    // 60px par heure, donc position = (heure * 60) + (minutes * 1)
    // Pas d'offset pour un alignement parfait avec les heures
    const position = (hour * 60) + minutes;
    
    console.log(`Event "${event.title}" position:`, {
      time: eventDate.toLocaleTimeString(),
      hour,
      minutes,
      position: `${position}px`
    });
    
    return position;
  }

  getEventHeight(event: CalendarEventResponse): number {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime || event.start_datetime);
    
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    
    const durationMinutes = endMinutes - startMinutes;
    
    // Minimum height de 30px, sinon calculer selon la durée
    return Math.max(30, durationMinutes);
  }

  getTicketTopPosition(ticket: any): number {
    const ticketDate = new Date(ticket.created_at);
    const hour = ticketDate.getHours();
    const minutes = ticketDate.getMinutes();
    
    // 60px par heure, donc position = (heure * 60) + (minutes * 1)
    return (hour * 60) + minutes;
  }

  getLogTopPosition(log: any): number {
    const logDate = new Date(log.timestamp);
    const hour = logDate.getHours();
    const minutes = logDate.getMinutes();
    
    // 60px par heure, donc position = (heure * 60) + (minutes * 1)
    return (hour * 60) + minutes;
  }

  getCurrentPeriodTitle(): string {
    if (!this.viewState) return '';
    
    const date = this.viewState.currentDate;
    
    switch (this.viewState.currentView) {
      case 'month':
        return date.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long' 
        });
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('fr-FR', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        });
      case 'list':
        return 'All Events';
      default:
        return '';
    }
  }

  setView(view: 'month' | 'week' | 'day' | 'list'): void {
    this.calendarStateService.setCurrentView(view);
  }

  previousPeriod(): void {
    switch (this.viewState.currentView) {
      case 'month':
        this.calendarStateService.previousMonth();
        break;
      case 'week':
        this.calendarStateService.previousWeek();
        break;
      case 'day':
        this.calendarStateService.previousDay();
        break;
    }
  }

  nextPeriod(): void {
    switch (this.viewState.currentView) {
      case 'month':
        this.calendarStateService.nextMonth();
        break;
      case 'week':
        this.calendarStateService.nextWeek();
        break;
      case 'day':
        this.calendarStateService.nextDay();
        break;
    }
  }

  goToToday(): void {
    this.calendarStateService.goToToday();
  }

  onDayClick(date: Date): void {
    // Set the current date and switch to day view
    this.calendarStateService.setCurrentDate(date);
    this.calendarStateService.setCurrentView('day');
    this.dayClick.emit(date);
  }

  onDayRightClick(event: DayRightClickEvent): void {
    this.dayRightClick.emit(event);
  }

  onEventClick(event: CalendarEventResponse): void {
    this.eventClick.emit(event);
  }

  onEventEditClick(event: CalendarEventResponse, mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    console.log('🖱️ Clic droit sur événement MONTH:', event.title);
    this.eventEdit.emit(event);
  }

  onEventEdit(event: CalendarEventResponse): void {
    console.log('📝 Édition d\'événement demandée:', event.title);
    console.log('📝 Événement détails:', event);
    this.eventEdit.emit(event);
  }

  onEventDelete(event: CalendarEventResponse): void {
    this.eventDelete.emit(event);
  }

  onTicketClick(ticket: any): void {
    console.log('Ticket clicked:', ticket);
    // TODO: Implement ticket click handler
  }

  onLogClick(log: any): void {
    console.log('Log clicked:', log);
    // TODO: Implement log click handler
  }

  onAddEvent(): void {
    // Emit event to parent component to open event modal
    this.dayRightClick.emit({ date: this.viewState.currentDate });
  }
}
