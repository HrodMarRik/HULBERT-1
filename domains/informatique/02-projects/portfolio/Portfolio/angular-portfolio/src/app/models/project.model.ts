export interface Project {
  id: number;
  company_id: number;
  primary_contact_id?: number;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  progress_percentage: number;
  team_assigned?: string;
  commercial_status?: string;
  sale_price?: number;
  daily_rate?: number;
  monthly_rate?: number;
  annual_rate?: number;
  rental_terms?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  company_name?: string;
  primary_contact_name?: string;
}

export interface ProjectCreate {
  company_id: number;
  primary_contact_id?: number;
  title: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  progress_percentage?: number;
  team_assigned?: string;
  commercial_status?: string;
  sale_price?: number;
  daily_rate?: number;
  monthly_rate?: number;
  annual_rate?: number;
  rental_terms?: string;
  tags?: string;
}

export interface ProjectUpdate {
  company_id?: number;
  primary_contact_id?: number;
  title?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  progress_percentage?: number;
  team_assigned?: string;
  commercial_status?: string;
  sale_price?: number;
  daily_rate?: number;
  monthly_rate?: number;
  annual_rate?: number;
  rental_terms?: string;
  tags?: string;
}

export interface ProjectResponse extends Project {}

export interface ProjectDetailResponse extends Project {
  company: CompanyResponse;
  primary_contact?: ContactResponse;
  phases: ProjectPhaseResponse[];
  deliverables: ProjectDeliverableResponse[];
  documents: DocumentResponse[];
  notes?: ProjectNote[];
  events?: any[];
  contacts?: any[];
}

export interface ProjectPhase {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  status: string;
  order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhaseCreate {
  project_id: number;
  name: string;
  description?: string;
  status?: string;
  order?: number;
  start_date?: string;
  end_date?: string;
}

export interface ProjectPhaseUpdate {
  name?: string;
  description?: string;
  status?: string;
  order?: number;
  start_date?: string;
  end_date?: string;
}

export interface ProjectPhaseResponse extends ProjectPhase {}

export interface ProjectDeliverable {
  id: number;
  project_id: number;
  phase_id?: number;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDeliverableCreate {
  project_id: number;
  phase_id?: number;
  title: string;
  description?: string;
  status?: string;
  due_date?: string;
}

export interface ProjectDeliverableUpdate {
  phase_id?: number;
  title?: string;
  description?: string;
  status?: string;
  due_date?: string;
  completed_at?: string;
}

export interface ProjectDeliverableResponse extends ProjectDeliverable {}

export interface ProjectStats {
  total: number;
  by_status: {
    planning: number;
    active: number;
    on_hold: number;
    completed: number;
    cancelled: number;
  };
  total_budget: number;
  average_progress: number;
}

// Forward references
export interface CompanyResponse {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
  notes?: string;
  tags?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  contacts_count?: number;
  projects_count?: number;
}

export interface ContactResponse {
  id: number;
  company_id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  status: string;
  notes?: string;
  tags?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  company_name?: string;
}

export interface DocumentResponse {
  id: number;
  company_id?: number;
  contact_id?: number;
  project_id?: number;
  filename: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  uploaded_by_user_id: number;
  uploaded_at: string;
}

export interface ProjectNote {
  id: number;
  project_id: number;
  content: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  created_by_username?: string;
}

export interface ProjectNoteCreate {
  project_id: number;
  content: string;
}

export interface ProjectNoteUpdate {
  content?: string;
}

export interface ProjectNoteResponse extends ProjectNote {}

export interface ProjectTimelineItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  icon: string;
}

export interface ProjectContact {
  id: number;
  project_id: number;
  contact_id: number;
  role?: string;
  added_at: string;
  contact?: ContactResponse;
}

export interface ProjectContactCreate {
  project_id: number;
  contact_id: number;
  role?: string;
}

export interface ProjectContactUpdate {
  role?: string;
}

export interface ProjectContactResponse extends ProjectContact {}

// Budget-related interfaces - using the ones from budget.model.ts
export interface BudgetAnalysis {
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  percentage_spent: number;
  transactions_count: number;
  currency: string;
}

export interface BudgetAlert {
  id: number;
  project_id: number;
  alert_type: 'budget_exceeded' | 'budget_warning' | 'budget_low';
  message: string;
  threshold_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface ProjectPricingCalculation {
  project_id: number;
  base_price: number;
  daily_rate: number;
  monthly_rate: number;
  annual_rate: number;
  currency: string;
  calculation_method: 'fixed' | 'hourly' | 'daily' | 'monthly' | 'annual';
  estimated_hours?: number;
  estimated_days?: number;
  estimated_months?: number;
  estimated_years?: number;
  total_calculated_price: number;
  laborCost?: number;
  totalCost?: number;
  marginAmount?: number;
  totalPrice?: number;
  hourlyRate?: number;
  expenses?: number;
  marginPercentage?: number;
  profitMargin?: number;
  breakEvenHours?: number;
  created_at: string;
  updated_at: string;
}