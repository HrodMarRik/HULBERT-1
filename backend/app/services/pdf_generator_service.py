"""
Service de génération de PDF pour factures et bulletins de paie
"""
import logging
from datetime import datetime
from typing import Optional
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.models import Invoice, PayrollEntry, Employee

logger = logging.getLogger(__name__)


class PDFGeneratorService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Configurer les styles personnalisés"""
        # Style pour le titre principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Style pour les sous-titres
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.darkblue
        ))
        
        # Style pour les informations de facture
        self.styles.add(ParagraphStyle(
            name='InvoiceInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_LEFT
        ))
        
        # Style pour les montants
        self.styles.add(ParagraphStyle(
            name='Amount',
            parent=self.styles['Normal'],
            fontSize=12,
            alignment=TA_RIGHT,
            textColor=colors.black
        ))

    def generate_invoice_pdf(self, invoice: Invoice) -> bytes:
        """Générer le PDF d'une facture"""
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
            
            # Contenu du PDF
            story = []
            
            # En-tête de la facture
            story.append(self._create_invoice_header(invoice))
            story.append(Spacer(1, 20))
            
            # Informations client et facture
            story.append(self._create_invoice_info_section(invoice))
            story.append(Spacer(1, 20))
            
            # Tableau des lignes de facture
            story.append(self._create_invoice_lines_table(invoice))
            story.append(Spacer(1, 20))
            
            # Totaux
            story.append(self._create_invoice_totals_section(invoice))
            story.append(Spacer(1, 30))
            
            # Notes et conditions
            if invoice.notes or invoice.payment_terms:
                story.append(self._create_invoice_notes_section(invoice))
            
            # Construire le PDF
            doc.build(story)
            
            # Retourner le contenu du buffer
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du PDF de facture: {e}")
            raise

    def generate_payslip_pdf(self, payslip: PayrollEntry) -> bytes:
        """Générer le PDF d'un bulletin de paie"""
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
            
            # Contenu du PDF
            story = []
            
            # En-tête du bulletin de paie
            story.append(self._create_payslip_header(payslip))
            story.append(Spacer(1, 20))
            
            # Informations employé et période
            story.append(self._create_payslip_info_section(payslip))
            story.append(Spacer(1, 20))
            
            # Tableau des éléments de paie
            story.append(self._create_payslip_elements_table(payslip))
            story.append(Spacer(1, 20))
            
            # Totaux et net à payer
            story.append(self._create_payslip_totals_section(payslip))
            
            # Construire le PDF
            doc.build(story)
            
            # Retourner le contenu du buffer
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du PDF de bulletin de paie: {e}")
            raise

    def _create_invoice_header(self, invoice: Invoice) -> Paragraph:
        """Créer l'en-tête de la facture"""
        header_text = f"""
        <para align="center">
            <b>FACTURE</b><br/>
            N° {invoice.invoice_number}
        </para>
        """
        return Paragraph(header_text, self.styles['CustomTitle'])

    def _create_invoice_info_section(self, invoice: Invoice) -> Table:
        """Créer la section des informations de facture"""
        # Informations client
        client_info = f"""
        <b>Facturé à :</b><br/>
        {invoice.client_name}<br/>
        """
        if invoice.client_address:
            client_info += f"{invoice.client_address}<br/>"
        if invoice.client_email:
            client_info += f"{invoice.client_email}"
        
        # Informations facture
        invoice_info = f"""
        <b>Date d'émission :</b> {invoice.issue_date.strftime('%d/%m/%Y')}<br/>
        <b>Date d'échéance :</b> {invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'N/A'}<br/>
        <b>Statut :</b> {invoice.status.title()}<br/>
        """
        if invoice.reference_number:
            invoice_info += f"<b>Référence :</b> {invoice.reference_number}<br/>"
        
        data = [
            [Paragraph(client_info, self.styles['InvoiceInfo']), 
             Paragraph(invoice_info, self.styles['InvoiceInfo'])]
        ]
        
        table = Table(data, colWidths=[8*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        return table

    def _create_invoice_lines_table(self, invoice: Invoice) -> Table:
        """Créer le tableau des lignes de facture"""
        # En-têtes du tableau
        headers = ['Description', 'Qté', 'Prix unit.', 'TVA %', 'Total HT']
        
        # Données des lignes
        data = [headers]
        for line in invoice.invoice_lines:
            data.append([
                line.description,
                f"{line.quantity:.2f}",
                f"{line.unit_price:.2f} €",
                f"{line.tax_rate_percentage:.1f}%",
                f"{line.line_total:.2f} €"
            ])
        
        table = Table(data, colWidths=[8*cm, 2*cm, 2*cm, 2*cm, 2*cm])
        table.setStyle(TableStyle([
            # En-têtes
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Données
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),  # Aligner les nombres à droite
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        return table

    def _create_invoice_totals_section(self, invoice: Invoice) -> Table:
        """Créer la section des totaux de la facture"""
        data = [
            ['Sous-total HT', f"{invoice.subtotal:.2f} €"],
            ['TVA', f"{invoice.total_tax:.2f} €"],
            ['TOTAL TTC', f"{invoice.total_amount:.2f} €"]
        ]
        
        table = Table(data, colWidths=[12*cm, 4*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ('LINEABOVE', (0, -2), (-1, -2), 1, colors.black),
        ]))
        
        return table

    def _create_invoice_notes_section(self, invoice: Invoice) -> Table:
        """Créer la section des notes de la facture"""
        notes_text = ""
        if invoice.notes:
            notes_text += f"<b>Notes :</b><br/>{invoice.notes}<br/><br/>"
        if invoice.payment_terms:
            notes_text += f"<b>Conditions de paiement :</b><br/>{invoice.payment_terms}"
        
        data = [[Paragraph(notes_text, self.styles['Normal'])]]
        
        table = Table(data, colWidths=[16*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        return table

    def _create_payslip_header(self, payslip: PayrollEntry) -> Paragraph:
        """Créer l'en-tête du bulletin de paie"""
        header_text = f"""
        <para align="center">
            <b>BULLETIN DE PAIE</b><br/>
            Période : {payslip.period_month:02d}/{payslip.period_year}
        </para>
        """
        return Paragraph(header_text, self.styles['CustomTitle'])

    def _create_payslip_info_section(self, payslip: PayrollEntry) -> Table:
        """Créer la section des informations du bulletin de paie"""
        employee = payslip.employee
        
        # Informations employé
        employee_info = f"""
        <b>Employé :</b><br/>
        {employee.first_name} {employee.last_name}<br/>
        {employee.position}<br/>
        {employee.department if employee.department else ''}
        """
        
        # Informations période
        period_info = f"""
        <b>Période :</b> {payslip.period_month:02d}/{payslip.period_year}<br/>
        <b>Heures travaillées :</b> {payslip.hours_worked:.1f}h<br/>
        <b>Heures supplémentaires :</b> {payslip.overtime_hours:.1f}h<br/>
        <b>Statut :</b> {payslip.status.title()}
        """
        
        data = [
            [Paragraph(employee_info, self.styles['InvoiceInfo']), 
             Paragraph(period_info, self.styles['InvoiceInfo'])]
        ]
        
        table = Table(data, colWidths=[8*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        return table

    def _create_payslip_elements_table(self, payslip: PayrollEntry) -> Table:
        """Créer le tableau des éléments de paie"""
        # En-têtes du tableau
        headers = ['Éléments', 'Base', 'Taux', 'Montant']
        
        # Données des éléments
        data = [headers]
        
        # Salaire de base
        data.append(['Salaire de base', f"{payslip.gross_salary:.2f} €", '', f"{payslip.gross_salary:.2f} €"])
        
        # Heures supplémentaires
        if payslip.overtime_hours > 0:
            overtime_amount = payslip.overtime_hours * (payslip.gross_salary / 35) * payslip.overtime_rate
            data.append(['Heures supplémentaires', f"{payslip.overtime_hours:.1f}h", f"{payslip.overtime_rate:.2f}", f"{overtime_amount:.2f} €"])
        
        # Primes
        if payslip.monthly_bonus > 0:
            data.append(['Prime mensuelle', '', '', f"{payslip.monthly_bonus:.2f} €"])
        if payslip.exceptional_bonus > 0:
            data.append(['Prime exceptionnelle', '', '', f"{payslip.exceptional_bonus:.2f} €"])
        
        # Avantages
        if payslip.meal_vouchers > 0:
            data.append(['Tickets restaurant', '', '', f"{payslip.meal_vouchers:.2f} €"])
        if payslip.transport_allowance > 0:
            data.append(['Indemnité transport', '', '', f"{payslip.transport_allowance:.2f} €"])
        
        # Cotisations salariales
        data.append(['', '', '', ''])
        data.append(['COTISATIONS SALARIALES', '', '', ''])
        data.append(['Maladie', f"{payslip.gross_salary:.2f} €", '0.75%', f"{payslip.gross_salary * 0.0075:.2f} €"])
        data.append(['Vieillesse', f"{payslip.gross_salary:.2f} €", '6.90%', f"{payslip.gross_salary * 0.069:.2f} €"])
        data.append(['Chômage', f"{payslip.gross_salary:.2f} €", '2.40%', f"{payslip.gross_salary * 0.024:.2f} €"])
        data.append(['Retraite complémentaire', f"{payslip.gross_salary:.2f} €", '3.15%', f"{payslip.gross_salary * 0.0315:.2f} €"])
        data.append(['CSG', f"{payslip.gross_salary:.2f} €", '2.40%', f"{payslip.gross_salary * 0.024:.2f} €"])
        data.append(['CRDS', f"{payslip.gross_salary:.2f} €", '0.50%', f"{payslip.gross_salary * 0.005:.2f} €"])
        
        table = Table(data, colWidths=[6*cm, 3*cm, 3*cm, 4*cm])
        table.setStyle(TableStyle([
            # En-têtes
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Données
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            
            # Section cotisations
            ('FONTNAME', (0, 7), (-1, 7), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 7), (-1, 7), colors.lightgrey),
        ]))
        
        return table

    def _create_payslip_totals_section(self, payslip: PayrollEntry) -> Table:
        """Créer la section des totaux du bulletin de paie"""
        data = [
            ['Salaire brut', f"{payslip.gross_salary:.2f} €"],
            ['Cotisations salariales', f"-{payslip.employee_social_charges:.2f} €"],
            ['Cotisations patronales', f"{payslip.employer_social_charges:.2f} €"],
            ['', ''],
            ['NET À PAYER', f"{payslip.net_salary:.2f} €"]
        ]
        
        table = Table(data, colWidths=[12*cm, 4*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 14),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ('LINEABOVE', (0, -2), (-1, -2), 1, colors.black),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightblue),
        ]))
        
        return table
