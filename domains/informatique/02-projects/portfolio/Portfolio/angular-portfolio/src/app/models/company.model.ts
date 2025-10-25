export interface Company {
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

export interface CompanyCreate {
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
  notes?: string;
  tags?: string;
  logo_url?: string;
}

export interface CompanyUpdate {
  name?: string;
  industry?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
  notes?: string;
  tags?: string;
  logo_url?: string;
}

export interface CompanyResponse extends Company {}

export interface CompanyDetailResponse extends Company {
  contacts: ContactResponse[];
  company_contacts: CompanyContact[];
  projects: ProjectResponse[];
  interactions: InteractionResponse[];
  documents: DocumentResponse[];
}

export interface CompanyStats {
  total: number;
  by_status: {
    client: number;
    prospect: number;
    archived: number;
  };
  active_projects: number;
}

export interface CompanyContact {
  id: number;
  company_id: number;
  contact_id: number;
  role?: string;
  department?: string;
  is_primary: boolean;
  added_at: string;
  contact?: ContactResponse;
}

export interface CompanyContactCreate {
  company_id: number;
  contact_id: number;
  role?: string;
  department?: string;
  is_primary?: boolean;
}

export interface CompanyContactUpdate {
  role?: string;
  department?: string;
  is_primary?: boolean;
}

// Forward references
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

export interface CompanyContactListResponse {
  company_id: number;
  company_name: string;
  contacts: CompanyContact[];
}