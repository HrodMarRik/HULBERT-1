"""Add database indexes for performance

Revision ID: add_performance_indexes
Revises: 
Create Date: 2025-10-25 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_performance_indexes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add performance indexes"""
    
    # Indexes for tickets table
    op.create_index('ix_tickets_status', 'tickets', ['status'])
    op.create_index('ix_tickets_priority', 'tickets', ['priority'])
    op.create_index('ix_tickets_assigned_to', 'tickets', ['assigned_to'])
    op.create_index('ix_tickets_created_at', 'tickets', ['created_at'])
    op.create_index('ix_tickets_updated_at', 'tickets', ['updated_at'])
    
    # Indexes for projects table
    op.create_index('ix_projects_status', 'projects', ['status'])
    op.create_index('ix_projects_created_at', 'projects', ['created_at'])
    op.create_index('ix_projects_start_date', 'projects', ['start_date'])
    op.create_index('ix_projects_end_date', 'projects', ['end_date'])
    
    # Indexes for invoices table
    op.create_index('ix_invoices_status', 'invoices', ['status'])
    op.create_index('ix_invoices_client_id', 'invoices', ['client_id'])
    op.create_index('ix_invoices_issue_date', 'invoices', ['issue_date'])
    op.create_index('ix_invoices_due_date', 'invoices', ['due_date'])
    op.create_index('ix_invoices_created_at', 'invoices', ['created_at'])
    
    # Indexes for accounting_entries table
    op.create_index('ix_accounting_entries_date', 'accounting_entries', ['date'])
    op.create_index('ix_accounting_entries_account_id', 'accounting_entries', ['account_id'])
    op.create_index('ix_accounting_entries_entry_type', 'accounting_entries', ['entry_type'])
    op.create_index('ix_accounting_entries_created_at', 'accounting_entries', ['created_at'])
    
    # Indexes for employees table
    op.create_index('ix_employees_email', 'employees', ['email'])
    op.create_index('ix_employees_position', 'employees', ['position'])
    op.create_index('ix_employees_hire_date', 'employees', ['hire_date'])
    op.create_index('ix_employees_status', 'employees', ['status'])
    
    # Indexes for payslips table
    op.create_index('ix_payslips_employee_id', 'payslips', ['employee_id'])
    op.create_index('ix_payslips_period_year', 'payslips', ['period_year'])
    op.create_index('ix_payslips_period_month', 'payslips', ['period_month'])
    op.create_index('ix_payslips_created_at', 'payslips', ['created_at'])
    
    # Indexes for companies table
    op.create_index('ix_companies_name', 'companies', ['name'])
    op.create_index('ix_companies_email', 'companies', ['email'])
    op.create_index('ix_companies_created_at', 'companies', ['created_at'])
    
    # Indexes for contacts table
    op.create_index('ix_contacts_email', 'contacts', ['email'])
    op.create_index('ix_contacts_company_id', 'contacts', ['company_id'])
    op.create_index('ix_contacts_created_at', 'contacts', ['created_at'])
    
    # Indexes for users table
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_is_active', 'users', ['is_active'])
    
    # Indexes for competitive_analyses table
    op.create_index('ix_competitive_analyses_user_id', 'competitive_analyses', ['user_id'])
    op.create_index('ix_competitive_analyses_status', 'competitive_analyses', ['status'])
    op.create_index('ix_competitive_analyses_created_at', 'competitive_analyses', ['created_at'])
    
    # Composite indexes for common queries
    op.create_index('ix_tickets_status_priority', 'tickets', ['status', 'priority'])
    op.create_index('ix_projects_status_dates', 'projects', ['status', 'start_date', 'end_date'])
    op.create_index('ix_invoices_status_dates', 'invoices', ['status', 'issue_date', 'due_date'])
    op.create_index('ix_accounting_entries_account_date', 'accounting_entries', ['account_id', 'date'])
    op.create_index('ix_payslips_employee_period', 'payslips', ['employee_id', 'period_year', 'period_month'])


def downgrade():
    """Remove performance indexes"""
    
    # Drop composite indexes first
    op.drop_index('ix_payslips_employee_period', 'payslips')
    op.drop_index('ix_accounting_entries_account_date', 'accounting_entries')
    op.drop_index('ix_invoices_status_dates', 'invoices')
    op.drop_index('ix_projects_status_dates', 'projects')
    op.drop_index('ix_tickets_status_priority', 'tickets')
    
    # Drop single column indexes
    op.drop_index('ix_competitive_analyses_created_at', 'competitive_analyses')
    op.drop_index('ix_competitive_analyses_status', 'competitive_analyses')
    op.drop_index('ix_competitive_analyses_user_id', 'competitive_analyses')
    
    op.drop_index('ix_users_is_active', 'users')
    op.drop_index('ix_users_username', 'users')
    op.drop_index('ix_users_email', 'users')
    
    op.drop_index('ix_contacts_created_at', 'contacts')
    op.drop_index('ix_contacts_company_id', 'contacts')
    op.drop_index('ix_contacts_email', 'contacts')
    
    op.drop_index('ix_companies_created_at', 'companies')
    op.drop_index('ix_companies_email', 'companies')
    op.drop_index('ix_companies_name', 'companies')
    
    op.drop_index('ix_payslips_created_at', 'payslips')
    op.drop_index('ix_payslips_period_month', 'payslips')
    op.drop_index('ix_payslips_period_year', 'payslips')
    op.drop_index('ix_payslips_employee_id', 'payslips')
    
    op.drop_index('ix_employees_status', 'employees')
    op.drop_index('ix_employees_hire_date', 'employees')
    op.drop_index('ix_employees_position', 'employees')
    op.drop_index('ix_employees_email', 'employees')
    
    op.drop_index('ix_accounting_entries_created_at', 'accounting_entries')
    op.drop_index('ix_accounting_entries_entry_type', 'accounting_entries')
    op.drop_index('ix_accounting_entries_account_id', 'accounting_entries')
    op.drop_index('ix_accounting_entries_date', 'accounting_entries')
    
    op.drop_index('ix_invoices_created_at', 'invoices')
    op.drop_index('ix_invoices_due_date', 'invoices')
    op.drop_index('ix_invoices_issue_date', 'invoices')
    op.drop_index('ix_invoices_client_id', 'invoices')
    op.drop_index('ix_invoices_status', 'invoices')
    
    op.drop_index('ix_projects_end_date', 'projects')
    op.drop_index('ix_projects_start_date', 'projects')
    op.drop_index('ix_projects_created_at', 'projects')
    op.drop_index('ix_projects_status', 'projects')
    
    op.drop_index('ix_tickets_updated_at', 'tickets')
    op.drop_index('ix_tickets_created_at', 'tickets')
    op.drop_index('ix_tickets_assigned_to', 'tickets')
    op.drop_index('ix_tickets_priority', 'tickets')
    op.drop_index('ix_tickets_status', 'tickets')
