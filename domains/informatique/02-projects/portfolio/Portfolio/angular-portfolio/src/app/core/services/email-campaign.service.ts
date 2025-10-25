import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  body_html: string;
  variables?: any;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface EmailCampaign {
  id: number;
  project_id?: number;
  template_id: number;
  name: string;
  subject: string;
  body_html: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface EmailRecipient {
  id: number;
  campaign_id: number;
  contact_id?: number;
  email: string;
  name?: string;
  status: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  open_count: number;
  click_count: number;
  created_at: string;
}

export interface EmailList {
  id: number;
  name: string;
  description?: string;
  contact_ids?: number[];
  filters?: any;
  total_contacts: number;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
}

export interface CampaignStats {
  campaign_id: number;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export interface EmailDashboardStats {
  total_campaigns: number;
  total_templates: number;
  total_lists: number;
  campaigns_by_status: any;
  recent_campaigns: number;
  recent_campaigns_data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailCampaignService {
  private apiUrl = `${environment.apiUrl}/email-campaigns`;
  private dashboardStatsSubject = new BehaviorSubject<EmailDashboardStats | null>(null);
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Email Templates
  createTemplate(template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    return this.http.post<EmailTemplate>(`${this.apiUrl}/templates`, template);
  }

  getTemplates(templateType?: string): Observable<EmailTemplate[]> {
    const params = templateType ? { template_type: templateType } : {};
    return this.http.get<EmailTemplate[]>(`${this.apiUrl}/templates`, { params: params as any });
  }

  getTemplate(templateId: number): Observable<EmailTemplate> {
    return this.http.get<EmailTemplate>(`${this.apiUrl}/templates/${templateId}`);
  }

  updateTemplate(templateId: number, template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    return this.http.put<EmailTemplate>(`${this.apiUrl}/templates/${templateId}`, template);
  }

  deleteTemplate(templateId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/templates/${templateId}`);
  }

  // Email Campaigns
  createCampaign(campaign: Partial<EmailCampaign>): Observable<EmailCampaign> {
    return this.http.post<EmailCampaign>(`${this.apiUrl}/campaigns`, campaign);
  }

  getCampaigns(projectId?: number): Observable<EmailCampaign[]> {
    const params = projectId ? { project_id: projectId } : {};
    return this.http.get<EmailCampaign[]>(`${this.apiUrl}/campaigns`, { params: params as any });
  }

  getCampaign(campaignId: number): Observable<EmailCampaign> {
    return this.http.get<EmailCampaign>(`${this.apiUrl}/campaigns/${campaignId}`);
  }

  updateCampaign(campaignId: number, campaign: Partial<EmailCampaign>): Observable<EmailCampaign> {
    return this.http.put<EmailCampaign>(`${this.apiUrl}/campaigns/${campaignId}`, campaign);
  }

  deleteCampaign(campaignId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/campaigns/${campaignId}`);
  }

  sendCampaign(campaignId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/campaigns/${campaignId}/send`, {});
  }

  scheduleCampaign(campaignId: number, scheduledAt: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/campaigns/${campaignId}/schedule`, { scheduled_at: scheduledAt });
  }

  getCampaignStats(campaignId: number): Observable<CampaignStats> {
    return this.http.get<CampaignStats>(`${this.apiUrl}/campaigns/${campaignId}/stats`);
  }

  // Email Recipients
  addRecipientsToCampaign(campaignId: number, recipients: Partial<EmailRecipient>[]): Observable<EmailRecipient[]> {
    return this.http.post<EmailRecipient[]>(`${this.apiUrl}/campaigns/${campaignId}/recipients`, recipients);
  }

  getCampaignRecipients(campaignId: number): Observable<EmailRecipient[]> {
    return this.http.get<EmailRecipient[]>(`${this.apiUrl}/campaigns/${campaignId}/recipients`);
  }

  // Email Lists
  createEmailList(emailList: Partial<EmailList>): Observable<EmailList> {
    return this.http.post<EmailList>(`${this.apiUrl}/lists`, emailList);
  }

  getEmailLists(): Observable<EmailList[]> {
    return this.http.get<EmailList[]>(`${this.apiUrl}/lists`);
  }

  getEmailList(listId: number): Observable<EmailList> {
    return this.http.get<EmailList>(`${this.apiUrl}/lists/${listId}`);
  }

  updateEmailList(listId: number, emailList: Partial<EmailList>): Observable<EmailList> {
    return this.http.put<EmailList>(`${this.apiUrl}/lists/${listId}`, emailList);
  }

  deleteEmailList(listId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lists/${listId}`);
  }

  // Dashboard Stats
  getDashboardStats(): Observable<EmailDashboardStats> {
    return this.http.get<EmailDashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  updateDashboardStats(): void {
    this.getDashboardStats().subscribe(stats => {
      this.dashboardStatsSubject.next(stats);
    });
  }

  // Helper methods
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'draft': '#6b7280',
      'scheduled': '#f59e0b',
      'sending': '#3b82f6',
      'sent': '#10b981',
      'failed': '#ef4444'
    };
    return statusColors[status] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'scheduled': 'Planifiée',
      'sending': 'En cours',
      'sent': 'Envoyée',
      'failed': 'Échec'
    };
    return statusLabels[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateOpenRate(campaign: EmailCampaign): number {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.opened_count / campaign.total_recipients) * 100;
  }

  calculateClickRate(campaign: EmailCampaign): number {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.clicked_count / campaign.total_recipients) * 100;
  }

  calculateBounceRate(campaign: EmailCampaign): number {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.bounced_count / campaign.total_recipients) * 100;
  }
}
