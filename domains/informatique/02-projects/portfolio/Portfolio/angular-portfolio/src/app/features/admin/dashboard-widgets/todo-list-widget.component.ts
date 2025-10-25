import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, Todo } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-todo-list-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="widget-card todo-widget">
      <div class="widget-header">
        <div class="widget-icon">✅</div>
        <div class="widget-title">To-Do List</div>
        <div class="widget-value">{{ todos.length || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <!-- Quick Add -->
        <div class="quick-add">
          <input 
            type="text" 
            [(ngModel)]="newTodoTitle" 
            placeholder="Ajouter une tâche..."
            (keyup.enter)="addTodo()"
            class="todo-input">
          <button (click)="addTodo()" class="add-btn" [disabled]="!newTodoTitle.trim()">
            +
          </button>
        </div>
        
        <!-- Todo List -->
        <div class="todo-list">
          <div class="todo-item" *ngFor="let todo of todos; trackBy: trackByTodoId">
            <div class="todo-checkbox">
              <input 
                type="checkbox" 
                [checked]="todo.status === 'completed'"
                (change)="toggleTodo(todo)">
            </div>
            <div class="todo-content" [class.completed]="todo.status === 'completed'">
              <div class="todo-title">{{ todo.title }}</div>
              <div class="todo-meta">
                <span class="todo-priority" [style.color]="getPriorityColor(todo.priority)">
                  {{ getPriorityLabel(todo.priority) }}
                </span>
                <span class="todo-date" *ngIf="todo.due_date">
                  {{ formatDate(todo.due_date) }}
                </span>
              </div>
            </div>
            <button (click)="deleteTodo(todo.id)" class="delete-btn">×</button>
          </div>
        </div>
        
        <!-- Empty State -->
        <div class="empty-state" *ngIf="!todos || todos.length === 0">
          <div class="empty-icon">📝</div>
          <div class="empty-text">Aucune tâche pour le moment</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/todos" class="view-more">Gérer les tâches →</a>
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      background: #1e293b;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 14px;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .widget-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .widget-icon {
      font-size: 24px;
    }
    
    .widget-title {
      font-size: 15px;
      font-weight: 600;
      color: #f1f5f9;
      flex: 1;
    }

    .widget-value {
      font-size: 20px;
      font-weight: 700;
      color: #60a5fa;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .quick-add {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .todo-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 6px;
      font-size: 14px;
      background: #334155;
      color: #f1f5f9;
    }

    .todo-input:focus {
      outline: none;
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }
    
    .add-btn {
      padding: 8px 12px;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid rgba(59, 130, 246, 0.5);
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .add-btn:hover:not(:disabled) {
      background: #334155;
      border-color: #60a5fa;
    }

    .add-btn:disabled {
      background: #1e293b;
      border-color: rgba(148, 163, 184, 0.3);
      color: #64748b;
      cursor: not-allowed;
    }
    
    .todo-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .todo-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.2s ease;
    }
    
    .todo-item:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }
    
    .todo-checkbox {
      margin-top: 2px;
    }
    
    .todo-checkbox input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #3b82f6;
    }
    
    .todo-content {
      flex: 1;
    }
    
    .todo-content.completed {
      opacity: 0.6;
    }
    
    .todo-content.completed .todo-title {
      text-decoration: line-through;
    }
    
    .todo-title {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .todo-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
    }
    
    .todo-priority {
      font-weight: 500;
    }
    
    .todo-date {
      color: #6b7280;
    }
    
    .delete-btn {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    
    .delete-btn:hover {
      background: #fee2e2;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    
    .empty-text {
      font-size: 14px;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 16px;
    }
    
    .view-more {
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    
    .view-more:hover {
      text-decoration: underline;
    }
  `]
})
export class TodoListWidgetComponent implements OnInit {
  @Input() todos: Todo[] = [];
  
  newTodoTitle = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  addTodo() {
    if (!this.newTodoTitle.trim()) return;
    
    const newTodo: any = {
      title: this.newTodoTitle.trim(),
      priority: 'medium'
    };
    
    this.dashboardService.createTodo(newTodo).subscribe({
      next: (todo) => {
        this.todos.unshift(todo);
        this.newTodoTitle = '';
      },
      error: (error) => {
        console.error('Erreur lors de la création du todo:', error);
      }
    });
  }

  toggleTodo(todo: Todo) {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    
    this.dashboardService.updateTodo(todo.id, { status: newStatus }).subscribe({
      next: (updatedTodo) => {
        const index = this.todos.findIndex(t => t.id === todo.id);
        if (index !== -1) {
          this.todos[index] = updatedTodo;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du todo:', error);
      }
    });
  }

  deleteTodo(id: number) {
    this.dashboardService.deleteTodo(id).subscribe({
      next: () => {
        this.todos = this.todos.filter(todo => todo.id !== id);
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du todo:', error);
      }
    });
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'critical': '#ef4444',
      'high': '#f59e0b',
      'medium': '#3b82f6',
      'low': '#10b981'
    };
    return colors[priority] || '#6b7280';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'critical': 'Critique',
      'high': 'Élevée',
      'medium': 'Moyenne',
      'low': 'Faible'
    };
    return labels[priority] || priority;
  }

  formatDate(dateString: string): string {
    return this.dashboardService.formatDate(dateString);
  }

  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }
}
