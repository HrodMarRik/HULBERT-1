"""
Service de facturation avec automatisation complète
"""
import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from app.models import Invoice, InvoiceLine, InvoiceTemplate, PaymentReminder, Project, Company, Contact
from app.schemas import InvoiceCreateUpdated, InvoiceUpdateUpdated, InvoiceResponseUpdated, PaymentReminderCreate
from app.services.pdf_generator_service import PDFGeneratorService

logger = logging.getLogger(__name__)


class InvoicingService:
    def __init__(self):
        self.pdf_service = PDFGeneratorService()

    def create_invoice(self, db: Session, invoice_data: InvoiceCreateUpdated, user_id: int) -> Invoice:
        """Créer une nouvelle facture"""
        try:
            # Générer le numéro de facture automatiquement
            invoice_number = self._generate_invoice_number(db)
            
            # Créer la facture
            invoice = Invoice(
                invoice_number=invoice_number,
                document_type=invoice_data.document_type,
                client_company_id=invoice_data.client_company_id,
                client_contact_id=invoice_data.client_contact_id,
                client_name=invoice_data.client_name,
                client_address=invoice_data.client_address,
                client_email=invoice_data.client_email,
                issue_date=invoice_data.issue_date,
                due_date=invoice_data.due_date,
                notes=invoice_data.notes,
                payment_terms=invoice_data.payment_terms,
                reference_number=invoice_data.reference_number,
                currency=invoice_data.currency,
                auto_generated=invoice_data.auto_generated,
                template_id=invoice_data.template_id,
                recurring_schedule=invoice_data.recurring_schedule,
                project_id=invoice_data.project_id,
                created_by_user_id=user_id
            )
            
            db.add(invoice)
            db.flush()  # Pour obtenir l'ID
            
            # Créer les lignes de facture
            subtotal = 0.0
            total_tax = 0.0
            
            for line_data in invoice_data.invoice_lines:
                line_total = line_data.quantity * line_data.unit_price
                tax_amount = line_total * (line_data.tax_rate_percentage / 100)
                
                invoice_line = InvoiceLine(
                    invoice_id=invoice.id,
                    description=line_data.description,
                    quantity=line_data.quantity,
                    unit_price=line_data.unit_price,
                    tax_rate_percentage=line_data.tax_rate_percentage,
                    line_total=line_total,
                    line_order=line_data.line_order
                )
                
                db.add(invoice_line)
                subtotal += line_total
                total_tax += tax_amount
            
            # Mettre à jour les totaux
            invoice.subtotal = subtotal
            invoice.total_tax = total_tax
            invoice.total_amount = subtotal + total_tax
            
            db.commit()
            db.refresh(invoice)
            
            logger.info(f"Facture créée: {invoice_number} pour {invoice_data.client_name}")
            return invoice
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la création de la facture: {e}")
            raise

    def update_invoice(self, db: Session, invoice_id: int, invoice_data: InvoiceUpdateUpdated, user_id: int) -> Optional[Invoice]:
        """Mettre à jour une facture existante"""
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                return None
            
            # Mettre à jour les champs
            update_data = invoice_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(invoice, field, value)
            
            invoice.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(invoice)
            
            logger.info(f"Facture mise à jour: {invoice.invoice_number}")
            return invoice
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la mise à jour de la facture {invoice_id}: {e}")
            raise

    def get_invoice(self, db: Session, invoice_id: int) -> Optional[Invoice]:
        """Récupérer une facture par ID"""
        return db.query(Invoice).filter(Invoice.id == invoice_id).first()

    def get_invoices(self, db: Session, skip: int = 0, limit: int = 100, 
                    status: Optional[str] = None, client_id: Optional[int] = None,
                    start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Invoice]:
        """Récupérer la liste des factures avec filtres"""
        query = db.query(Invoice)
        
        if status:
            query = query.filter(Invoice.status == status)
        
        if client_id:
            query = query.filter(or_(
                Invoice.client_company_id == client_id,
                Invoice.client_contact_id == client_id
            ))
        
        if start_date:
            query = query.filter(Invoice.issue_date >= start_date)
        
        if end_date:
            query = query.filter(Invoice.issue_date <= end_date)
        
        return query.order_by(desc(Invoice.created_at)).offset(skip).limit(limit).all()

    def delete_invoice(self, db: Session, invoice_id: int) -> bool:
        """Supprimer une facture"""
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                return False
            
            db.delete(invoice)
            db.commit()
            
            logger.info(f"Facture supprimée: {invoice.invoice_number}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la suppression de la facture {invoice_id}: {e}")
            raise

    def generate_invoices_from_projects(self, db: Session, project_ids: List[int], user_id: int) -> List[Invoice]:
        """Générer automatiquement des factures depuis des projets terminés"""
        try:
            generated_invoices = []
            
            for project_id in project_ids:
                project = db.query(Project).filter(Project.id == project_id).first()
                if not project or project.status != 'completed':
                    continue
                
                # Récupérer les informations du client
                client_company = None
                client_contact = None
                client_name = "Client"
                
                if project.company_id:
                    client_company = db.query(Company).filter(Company.id == project.company_id).first()
                    if client_company:
                        client_name = client_company.name
                
                if project.contact_id:
                    client_contact = db.query(Contact).filter(Contact.id == project.contact_id).first()
                    if client_contact:
                        client_name = f"{client_contact.first_name} {client_contact.last_name}"
                
                # Créer la facture
                invoice_data = InvoiceCreateUpdated(
                    document_type="invoice",
                    client_company_id=project.company_id,
                    client_contact_id=project.contact_id,
                    client_name=client_name,
                    client_address=client_company.address if client_company else None,
                    client_email=client_contact.email if client_contact else client_company.email if client_company else None,
                    issue_date=datetime.utcnow(),
                    due_date=datetime.utcnow() + timedelta(days=30),
                    notes=f"Facturation automatique pour le projet: {project.name}",
                    payment_terms="Paiement à 30 jours",
                    currency="EUR",
                    auto_generated=True,
                    project_id=project_id,
                    invoice_lines=[]  # À remplir avec les lignes du projet
                )
                
                invoice = self.create_invoice(db, invoice_data, user_id)
                generated_invoices.append(invoice)
            
            logger.info(f"{len(generated_invoices)} factures générées depuis les projets")
            return generated_invoices
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération automatique de factures: {e}")
            raise

    def mark_invoice_as_paid(self, db: Session, invoice_id: int, payment_date: Optional[date] = None) -> Optional[Invoice]:
        """Marquer une facture comme payée"""
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                return None
            
            invoice.status = "paid"
            invoice.payment_date = payment_date or datetime.utcnow()
            invoice.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(invoice)
            
            logger.info(f"Facture marquée comme payée: {invoice.invoice_number}")
            return invoice
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors du marquage de la facture {invoice_id} comme payée: {e}")
            raise

    def send_payment_reminder(self, db: Session, invoice_id: int, user_id: int, reminder_type: str = "gentle") -> Optional[PaymentReminder]:
        """Envoyer une relance de paiement"""
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                return None
            
            # Calculer les jours de retard
            days_overdue = 0
            if invoice.due_date:
                days_overdue = (datetime.utcnow().date() - invoice.due_date.date()).days
            
            # Générer le contenu de la relance selon le type
            subject, message = self._generate_reminder_content(invoice, reminder_type, days_overdue)
            
            # Créer la relance
            reminder_data = PaymentReminderCreate(
                invoice_id=invoice_id,
                reminder_type=reminder_type,
                reminder_date=datetime.utcnow(),
                days_overdue=days_overdue,
                subject=subject,
                message=message
            )
            
            reminder = PaymentReminder(
                invoice_id=reminder_data.invoice_id,
                reminder_type=reminder_data.reminder_type,
                reminder_date=reminder_data.reminder_date,
                days_overdue=reminder_data.days_overdue,
                subject=reminder_data.subject,
                message=reminder_data.message,
                created_by_user_id=user_id
            )
            
            db.add(reminder)
            db.commit()
            db.refresh(reminder)
            
            logger.info(f"Relance envoyée pour la facture: {invoice.invoice_number}")
            return reminder
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de l'envoi de la relance pour la facture {invoice_id}: {e}")
            raise

    def get_invoice_statistics(self, db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Dict[str, Any]:
        """Récupérer les statistiques des factures"""
        try:
            query = db.query(Invoice)
            
            if start_date:
                query = query.filter(Invoice.issue_date >= start_date)
            if end_date:
                query = query.filter(Invoice.issue_date <= end_date)
            
            invoices = query.all()
            
            total_amount = sum(invoice.total_amount for invoice in invoices)
            paid_amount = sum(invoice.total_amount for invoice in invoices if invoice.status == "paid")
            pending_amount = sum(invoice.total_amount for invoice in invoices if invoice.status in ["sent", "draft"])
            overdue_amount = sum(invoice.total_amount for invoice in invoices if invoice.status == "overdue")
            
            return {
                "total_invoices": len(invoices),
                "total_amount": total_amount,
                "paid_amount": paid_amount,
                "pending_amount": pending_amount,
                "overdue_amount": overdue_amount,
                "paid_percentage": (paid_amount / total_amount * 100) if total_amount > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des statistiques: {e}")
            raise

    def generate_invoice_pdf(self, db: Session, invoice_id: int) -> bytes:
        """Générer le PDF d'une facture"""
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if not invoice:
                raise ValueError("Facture non trouvée")
            
            return self.pdf_service.generate_invoice_pdf(invoice)
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du PDF pour la facture {invoice_id}: {e}")
            raise

    def _generate_invoice_number(self, db: Session) -> str:
        """Générer un numéro de facture unique"""
        try:
            # Format: FACT-YYYY-NNNN
            year = datetime.utcnow().year
            prefix = f"FACT-{year}-"
            
            # Récupérer le dernier numéro de l'année
            last_invoice = db.query(Invoice).filter(
                Invoice.invoice_number.like(f"{prefix}%")
            ).order_by(desc(Invoice.invoice_number)).first()
            
            if last_invoice:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            return f"{prefix}{new_number:04d}"
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du numéro de facture: {e}")
            raise

    def _generate_reminder_content(self, invoice: Invoice, reminder_type: str, days_overdue: int) -> tuple[str, str]:
        """Générer le contenu d'une relance selon le type"""
        if reminder_type == "gentle":
            subject = f"Rappel de paiement - Facture {invoice.invoice_number}"
            message = f"""
            Bonjour,
            
            Nous vous contactons concernant la facture {invoice.invoice_number} d'un montant de {invoice.total_amount:.2f} €.
            
            Cette facture était due le {invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'N/A'}.
            
            Pourriez-vous nous confirmer le règlement de cette facture ?
            
            Cordialement,
            L'équipe comptable
            """
        
        elif reminder_type == "firm":
            subject = f"Relance de paiement - Facture {invoice.invoice_number}"
            message = f"""
            Bonjour,
            
            Nous vous relançons concernant la facture {invoice.invoice_number} d'un montant de {invoice.total_amount:.2f} €.
            
            Cette facture était due le {invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'N/A'} et est en retard de {days_overdue} jours.
            
            Nous vous demandons de régulariser cette situation dans les plus brefs délais.
            
            Cordialement,
            L'équipe comptable
            """
        
        else:  # final
            subject = f"Dernière relance - Facture {invoice.invoice_number}"
            message = f"""
            Bonjour,
            
            Cette est notre dernière relance concernant la facture {invoice.invoice_number} d'un montant de {invoice.total_amount:.2f} €.
            
            Cette facture était due le {invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'N/A'} et est en retard de {days_overdue} jours.
            
            Sans règlement dans les 7 jours, nous serons contraints de prendre des mesures de recouvrement.
            
            Cordialement,
            L'équipe comptable
            """
        
        return subject, message
