import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login.component';
import { AuthGuard } from './core/auth/auth.guard';
import { portfolioRoutes } from './features/portfolio/portfolio.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'devops', loadComponent: () => import('./features/dev/cv/cv.component').then(m => m.CvComponent) },
  { path: 'gaming', loadComponent: () => import('./features/gaming/profile/profile.component').then(m => m.ProfileComponent) },
  { path: '__admin-portal/login', component: LoginComponent },
  { path: 'admin-portal/login', component: LoginComponent },
  
  // Portfolio routes
  ...portfolioRoutes,
  
  // Client Portal (public routes)
  { 
    path: 'client-portal/:token', 
    loadComponent: () => import('./features/client-portal/client-auth.component').then(m => m.ClientAuthComponent) 
  },
  { 
    path: 'client-portal/:token/tickets', 
    loadComponent: () => import('./features/client-portal/client-tickets-list.component').then(m => m.ClientTicketsListComponent) 
  },
  { 
    path: 'client-portal/:token/new-ticket', 
    loadComponent: () => import('./features/client-portal/client-ticket-form.component').then(m => m.ClientTicketFormComponent) 
  },
  { 
    path: 'admin', 
    canActivate: [AuthGuard], 
    loadComponent: () => import('./features/admin/admin-tabs/admin-tabs.component').then(m => m.AdminTabsComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
             { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard-widgets/dashboard-widgets.component').then(m => m.DashboardWidgetsComponent) },
             { path: 'dashboard-old', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
             { path: 'calendar', loadComponent: () => import('./features/admin/calendar/components/v2/calendar-container-v2.component').then(m => m.CalendarContainerV2Component) },
             { path: 'domains', loadComponent: () => import('./features/admin/modern-file-manager/modern-file-manager.component').then(m => m.ModernFileManagerComponent) },
             { path: 'agents', loadComponent: () => import('./features/admin/modern-agents/modern-agents.component').then(m => m.ModernAgentsComponent) },
             { path: 'tickets', loadComponent: () => import('./features/admin/tickets/tickets.component').then(m => m.TicketsComponent) },
             { path: 'ticket-logs', loadComponent: () => import('./features/admin/ticket-logs/ticket-logs.component').then(m => m.TicketLogsComponent) },
            { path: 'companies', loadComponent: () => import('./features/admin/companies/companies.component').then(m => m.CompaniesComponent) },
            { path: 'companies/:id', loadComponent: () => import('./features/admin/company-detail/company-detail.component').then(m => m.CompanyDetailComponent) },
            { path: 'contacts', loadComponent: () => import('./features/admin/contacts/contacts.component').then(m => m.ContactsComponent) },
            { path: 'contacts/:id', loadComponent: () => import('./features/admin/contact-detail/contact-detail.component').then(m => m.ContactDetailComponent) },
            { path: 'projects', loadComponent: () => import('./features/admin/projects/projects.component').then(m => m.ProjectsComponent) },
             { path: 'projects/:id', loadComponent: () => import('./features/admin/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
             { path: 'accounting', loadComponent: () => import('./features/admin/accounting/accounting-dashboard.component').then(m => m.AccountingDashboardComponent) },
             { path: 'accounting/invoices', loadComponent: () => import('./features/admin/accounting/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
             { path: 'accounting/invoices/new', loadComponent: () => import('./features/admin/accounting/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent) },
             { path: 'accounting/invoices/:id', loadComponent: () => import('./features/admin/accounting/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent) },
             { path: 'accounting/payroll', loadComponent: () => import('./features/admin/accounting/employee-list/employee-list.component').then(m => m.EmployeeListComponent) },
             { path: 'accounting/payroll/employees/new', loadComponent: () => import('./features/admin/accounting/employee-form/employee-form.component').then(m => m.EmployeeFormComponent) },
             { path: 'accounting/payroll/employees/:id', loadComponent: () => import('./features/admin/accounting/employee-form/employee-form.component').then(m => m.EmployeeFormComponent) },
             { path: 'accounting/payroll/generator', loadComponent: () => import('./features/admin/accounting/payslip-generator/payslip-generator.component').then(m => m.PayslipGeneratorComponent) },
             { path: 'accounting/social', loadComponent: () => import('./features/admin/accounting/dsn-generator/dsn-generator.component').then(m => m.DsnGeneratorComponent) },
             { path: 'accounting/reports', loadComponent: () => import('./features/admin/accounting/accounting-reports/accounting-reports.component').then(m => m.AccountingReportsComponent) },
             { path: 'logs', loadComponent: () => import('./features/admin/logs-viewer/logs-viewer.component').then(m => m.LogsViewerComponent) },
             { path: 'client-tokens', loadComponent: () => import('./features/admin/client-tokens/client-tokens-manager.component').then(m => m.ClientTokensManagerComponent) },
             
             // New modules
             { path: 'rss-reader', loadComponent: () => import('./features/admin/rss-reader/rss-reader.component').then(m => m.RssReaderComponent) },
             { path: 'email-security', loadComponent: () => import('./features/admin/email-security/email-security.component').then(m => m.EmailSecurityComponent) },
             { path: 'portfolio-management', loadComponent: () => import('./features/admin/portfolio-management/portfolio-management.component').then(m => m.PortfolioManagementComponent) },
             { path: 'business-plan', loadComponent: () => import('./features/admin/business-plan/business-plan.component').then(m => m.BusinessPlanComponent) },
             { path: 'competitive-analysis', loadComponent: () => import('./features/admin/competitive-analysis/competitive-analysis.component').then(m => m.CompetitiveAnalysisComponent) },
             { path: 'code-library', loadComponent: () => import('./features/admin/code-library/code-library.component').then(m => m.CodeLibraryComponent) },
             { path: 'diagrams', loadComponent: () => import('./features/admin/diagrams/diagrams.component').then(m => m.DiagramsComponent) },
             { path: 'wishlist', loadComponent: () => import('./features/admin/wishlist/wishlist.component').then(m => m.WishlistComponent) },
             { path: 'portfolio-cms', loadComponent: () => import('./features/admin/portfolio-cms/portfolio-cms.component').then(m => m.PortfolioCmsComponent) },
             { path: 'email-campaigns', loadComponent: () => import('./features/admin/email-campaigns/email-campaigns.component').then(m => m.EmailCampaignsComponent) },
             { path: 'client-portal', loadComponent: () => import('./features/admin/client-portal/client-portal.component').then(m => m.ClientPortalComponent) }
    ]
  }
];