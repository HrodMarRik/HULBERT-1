export interface Ticket {
  id: number;
  title: string;
  description: string;
  theme: string;
  priority: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  tags?: string;
  estimated_hours?: number;
  actual_hours?: number;
  project_id?: number;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  comment_count: number;
  comments?: TicketComment[];
  history?: TicketHistory[];
  created_by?: User;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  user?: User;
}

export interface TicketHistory {
  id: number;
  ticket_id: number;
  user_id: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  user?: User;
}

export interface User {
  id: number;
  username: string;
}

export interface TicketCreate {
  title: string;
  description: string;
  theme: string;
  priority: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  tags?: string;
  estimated_hours?: number;
  project_id?: number;
}

export interface TicketUpdate {
  title?: string;
  description?: string;
  theme?: string;
  priority?: string;
  status?: string;
  assigned_to?: string;
  due_date?: string;
  tags?: string;
  estimated_hours?: number;
  actual_hours?: number;
  project_id?: number;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unread_count: number;
}
