export interface Contact {
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

export interface ContactCreate {
  company_id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  status?: string;
  notes?: string;
  tags?: string;
  photo_url?: string;
}

export interface ContactUpdate {
  company_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  status?: string;
  notes?: string;
  tags?: string;
  photo_url?: string;
}

export interface ContactResponse extends Contact {}

export interface ContactDetailResponse extends Contact {
  company?: CompanyResponse;
  projects_as_primary: ProjectResponse[];
  interactions: InteractionResponse[];
  documents: DocumentResponse[];
}

export interface ContactStats {
  total: number;
  by_status: {
    active: number;
    inactive: number;
  };
  by_company: { [key: string]: number };
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

export interface ProjectResponse {
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
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  company_name?: string;
  primary_contact_name?: string;
  
  // Champs calculés pour les statistiques
  total_spent?: number;
  remaining_budget?: number;
  active_tickets_count?: number;
  completed_tickets_count?: number;
}

export interface InteractionResponse {
  id: number;
  company_id?: number;
  contact_id?: number;
  user_id: number;
  interaction_type: string;
  subject?: string;
  content?: string;
  interaction_date: string;
  created_at: string;
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