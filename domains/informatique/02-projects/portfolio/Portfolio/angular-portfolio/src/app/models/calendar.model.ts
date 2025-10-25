export interface RecurrencePattern {
  frequency: string; // daily, weekly, monthly, yearly
  interval: number;
  end_date?: Date;
  days_of_week?: number[]; // 0-6 (Monday-Sunday)
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_datetime: Date;
  end_datetime: Date;
  all_day?: boolean;
  category: string; // meeting, deadline, personal, project, other
  tags?: string;
  status: string; // planned, confirmed, cancelled
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  participants?: string[];
  reminder_minutes?: number[];
  ticket_id?: number;
  project_id?: number;
  company_id?: number;
  contact_id?: number;
  created_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  location?: string;
  start_datetime: Date;
  end_datetime: Date;
  all_day?: boolean;
  category?: string;
  tags?: string;
  status?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  participants?: string[];
  reminder_minutes?: number[];
  ticket_id?: number;
  project_id?: number;
  company_id?: number;
  contact_id?: number;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  location?: string;
  start_datetime?: Date;
  end_datetime?: Date;
  all_day?: boolean;
  category?: string;
  tags?: string;
  status?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  participants?: string[];
  reminder_minutes?: number[];
  ticket_id?: number;
  project_id?: number;
  company_id?: number;
  contact_id?: number;
}

export interface CalendarEventResponse extends CalendarEvent {
  is_past: boolean;
  is_today: boolean;
  is_upcoming: boolean;
}

export interface CalendarStats {
  total: number;
  upcoming: number;
  past: number;
  by_category: { [key: string]: number };
  by_status: { [key: string]: number };
}

