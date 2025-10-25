from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from typing import Dict, List, Optional
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)


class PDFGenerator:
    """
    Générateur de PDF pour factures, devis et bulletins de paie
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés"""
        # Style pour le titre principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Style pour les sous-titres
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        ))
        
        # Style pour les informations de l'entreprise
        self.styles.add(ParagraphStyle(
            name='CompanyInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_LEFT,
            spaceAfter=6
        ))
        
        # Style pour les informations du client
        self.styles.add(ParagraphStyle(
            name='ClientInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_RIGHT,
            spaceAfter=6
        ))
    
    def generate_invoice_pdf(self, invoice_data: Dict, output_path: str, 
                            company_info: Dict = None, include_logo: bool = True) -> str:
        """
        Génère un PDF de facture
        
        Args:
            invoice_data: Données de la facture
            output_path: Chemin de sortie du PDF
            company_info: Informations de l'entreprise
            include_logo: Inclure le logo de l'entreprise
        
        Returns:
            Chemin du fichier PDF généré
        """
        try:
            logger.info(f"Generating invoice PDF for invoice {invoice_data.get('invoice_number', 'N/A')}")
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # En-tête avec logo et informations entreprise
            if include_logo and company_info and company_info.get('logo_path'):
                try:
                    logo = Image(company_info['logo_path'], width=3*cm, height=2*cm)
                    story.append(logo)
                    story.append(Spacer(1, 20))
                except:
                    logger.warning("Could not load company logo")
            
            # Titre
            story.append(Paragraph("FACTURE", self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Informations de la facture
            invoice_info_data = [
                ['Numéro de facture:', invoice_data.get('invoice_number', '')],
                ['Date d\'émission:', invoice_data.get('issue_date', '').strftime('%d/%m/%Y') if invoice_data.get('issue_date') else ''],
                ['Date d\'échéance:', invoice_data.get('due_date', '').strftime('%d/%m/%Y') if invoice_data.get('due_date') else ''],
                ['Référence client:', invoice_data.get('reference_number', '')],
            ]
            
            invoice_info_table = Table(invoice_info_data, colWidths=[4*cm, 6*cm])
            invoice_info_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(invoice_info_table)
            story.append(Spacer(1, 20))
            
            # Informations entreprise et client
            company_client_data = []
            
            # Informations entreprise
            company_text = ""
            if company_info:
                company_text = f"""
                <b>{company_info.get('name', 'Votre Entreprise')}</b><br/>
                {company_info.get('address', '')}<br/>
                {company_info.get('city', '')} {company_info.get('postal_code', '')}<br/>
                SIRET: {company_info.get('siret', '')}<br/>
                TVA: {company_info.get('vat_number', '')}
                """
            
            # Informations client
            client_text = f"""
            <b>Facturé à:</b><br/>
            {invoice_data.get('client_name', '')}<br/>
            {invoice_data.get('client_address', '')}
            """
            
            company_client_data = [
                [Paragraph(company_text, self.styles['CompanyInfo']), 
                 Paragraph(client_text, self.styles['ClientInfo'])]
            ]
            
            company_client_table = Table(company_client_data, colWidths=[8*cm, 8*cm])
            company_client_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(company_client_table)
            story.append(Spacer(1, 30))
            
            # Lignes de facture
            story.append(Paragraph("Détail de la facture", self.styles['CustomHeading2']))
            story.append(Spacer(1, 10))
            
            # En-tête du tableau
            table_data = [['Description', 'Qté', 'Prix unitaire', 'TVA', 'Total']]
            
            # Lignes de la facture
            for line in invoice_data.get('invoice_lines', []):
                table_data.append([
                    line.get('description', ''),
                    str(line.get('quantity', 1)),
                    f"{line.get('unit_price', 0):.2f} €",
                    f"{line.get('tax_rate_percentage', 0):.1f}%",
                    f"{line.get('line_total', 0):.2f} €"
                ])
            
            # Totaux
            table_data.append(['', '', '', 'Sous-total:', f"{invoice_data.get('subtotal', 0):.2f} €"])
            table_data.append(['', '', '', 'TVA:', f"{invoice_data.get('total_tax', 0):.2f} €"])
            table_data.append(['', '', '', '<b>TOTAL TTC:</b>', f"<b>{invoice_data.get('total_amount', 0):.2f} €</b>"])
            
            invoice_table = Table(table_data, colWidths=[8*cm, 2*cm, 2*cm, 2*cm, 2*cm])
            invoice_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -3), 1, colors.black),
                ('LINEABOVE', (0, -3), (-1, -3), 2, colors.black),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ]))
            
            story.append(invoice_table)
            story.append(Spacer(1, 30))
            
            # Conditions de paiement
            if invoice_data.get('payment_terms'):
                story.append(Paragraph("Conditions de paiement", self.styles['CustomHeading2']))
                story.append(Paragraph(invoice_data['payment_terms'], self.styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Notes
            if invoice_data.get('notes'):
                story.append(Paragraph("Notes", self.styles['CustomHeading2']))
                story.append(Paragraph(invoice_data['notes'], self.styles['Normal']))
            
            # Générer le PDF
            doc.build(story)
            
            logger.info(f"Invoice PDF generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating invoice PDF: {e}")
            raise
    
    def generate_quote_pdf(self, quote_data: Dict, output_path: str, 
                          company_info: Dict = None, include_logo: bool = True) -> str:
        """
        Génère un PDF de devis
        """
        try:
            logger.info(f"Generating quote PDF for quote {quote_data.get('quote_number', 'N/A')}")
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # En-tête avec logo
            if include_logo and company_info and company_info.get('logo_path'):
                try:
                    logo = Image(company_info['logo_path'], width=3*cm, height=2*cm)
                    story.append(logo)
                    story.append(Spacer(1, 20))
                except:
                    logger.warning("Could not load company logo")
            
            # Titre
            story.append(Paragraph("DEVIS", self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Informations du devis
            quote_info_data = [
                ['Numéro de devis:', quote_data.get('quote_number', '')],
                ['Date d\'émission:', quote_data.get('issue_date', '').strftime('%d/%m/%Y') if quote_data.get('issue_date') else ''],
                ['Valide jusqu\'au:', quote_data.get('valid_until', '').strftime('%d/%m/%Y') if quote_data.get('valid_until') else ''],
            ]
            
            quote_info_table = Table(quote_info_data, colWidths=[4*cm, 6*cm])
            quote_info_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(quote_info_table)
            story.append(Spacer(1, 20))
            
            # Informations entreprise et client (similaire à la facture)
            company_text = ""
            if company_info:
                company_text = f"""
                <b>{company_info.get('name', 'Votre Entreprise')}</b><br/>
                {company_info.get('address', '')}<br/>
                {company_info.get('city', '')} {company_info.get('postal_code', '')}<br/>
                SIRET: {company_info.get('siret', '')}<br/>
                TVA: {company_info.get('vat_number', '')}
                """
            
            client_text = f"""
            <b>Devis pour:</b><br/>
            {quote_data.get('client_name', '')}<br/>
            {quote_data.get('client_address', '')}
            """
            
            company_client_data = [
                [Paragraph(company_text, self.styles['CompanyInfo']), 
                 Paragraph(client_text, self.styles['ClientInfo'])]
            ]
            
            company_client_table = Table(company_client_data, colWidths=[8*cm, 8*cm])
            company_client_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(company_client_table)
            story.append(Spacer(1, 30))
            
            # Lignes du devis
            story.append(Paragraph("Détail du devis", self.styles['CustomHeading2']))
            story.append(Spacer(1, 10))
            
            # Tableau des lignes (similaire à la facture)
            table_data = [['Description', 'Qté', 'Prix unitaire', 'TVA', 'Total']]
            
            for line in quote_data.get('quote_lines', []):
                table_data.append([
                    line.get('description', ''),
                    str(line.get('quantity', 1)),
                    f"{line.get('unit_price', 0):.2f} €",
                    f"{line.get('tax_rate_percentage', 0):.1f}%",
                    f"{line.get('line_total', 0):.2f} €"
                ])
            
            # Totaux
            table_data.append(['', '', '', 'Sous-total:', f"{quote_data.get('subtotal', 0):.2f} €"])
            table_data.append(['', '', '', 'TVA:', f"{quote_data.get('total_tax', 0):.2f} €"])
            table_data.append(['', '', '', '<b>TOTAL TTC:</b>', f"<b>{quote_data.get('total_amount', 0):.2f} €</b>"])
            
            quote_table = Table(table_data, colWidths=[8*cm, 2*cm, 2*cm, 2*cm, 2*cm])
            quote_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -3), 1, colors.black),
                ('LINEABOVE', (0, -3), (-1, -3), 2, colors.black),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ]))
            
            story.append(quote_table)
            story.append(Spacer(1, 30))
            
            # Conditions générales
            if quote_data.get('terms_conditions'):
                story.append(Paragraph("Conditions générales", self.styles['CustomHeading2']))
                story.append(Paragraph(quote_data['terms_conditions'], self.styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Notes
            if quote_data.get('notes'):
                story.append(Paragraph("Notes", self.styles['CustomHeading2']))
                story.append(Paragraph(quote_data['notes'], self.styles['Normal']))
            
            # Générer le PDF
            doc.build(story)
            
            logger.info(f"Quote PDF generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating quote PDF: {e}")
            raise
    
    def generate_payslip_pdf(self, payslip_data: Dict, employee_data: Dict, 
                           output_path: str, company_info: Dict = None) -> str:
        """
        Génère un PDF de bulletin de paie conforme à la réglementation française
        """
        try:
            logger.info(f"Generating payslip PDF for employee {employee_data.get('first_name', '')} {employee_data.get('last_name', '')}")
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # En-tête avec logo
            if company_info and company_info.get('logo_path'):
                try:
                    logo = Image(company_info['logo_path'], width=3*cm, height=2*cm)
                    story.append(logo)
                    story.append(Spacer(1, 20))
                except:
                    logger.warning("Could not load company logo")
            
            # Titre
            story.append(Paragraph("BULLETIN DE PAIE", self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Informations de l'entreprise
            if company_info:
                company_text = f"""
                <b>{company_info.get('name', 'Votre Entreprise')}</b><br/>
                {company_info.get('address', '')}<br/>
                {company_info.get('city', '')} {company_info.get('postal_code', '')}<br/>
                SIRET: {company_info.get('siret', '')}
                """
                story.append(Paragraph(company_text, self.styles['CompanyInfo']))
                story.append(Spacer(1, 20))
            
            # Informations du salarié et période
            employee_info_data = [
                ['Nom:', f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}"],
                ['Période:', f"{payslip_data.get('period_month', '')}/{payslip_data.get('period_year', '')}"],
                ['Contrat:', employee_data.get('contract_type', '')],
                ['Heures/semaine:', f"{employee_data.get('work_hours_per_week', '')}h"],
            ]
            
            employee_info_table = Table(employee_info_data, colWidths=[4*cm, 6*cm])
            employee_info_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(employee_info_table)
            story.append(Spacer(1, 30))
            
            # Détail du bulletin
            story.append(Paragraph("Détail du bulletin de paie", self.styles['CustomHeading2']))
            story.append(Spacer(1, 10))
            
            # Tableau des lignes
            table_data = [['Libellé', 'Base', 'Taux', 'Montant']]
            
            for line in payslip_data.get('payslip_lines', []):
                base_str = f"{line.get('base_amount', 0):.2f}" if line.get('base_amount') else ""
                rate_str = f"{line.get('rate_percentage', 0):.2f}%" if line.get('rate_percentage') else ""
                amount_str = f"{line.get('amount', 0):.2f} €"
                
                table_data.append([
                    line.get('description', ''),
                    base_str,
                    rate_str,
                    amount_str
                ])
            
            # Totaux
            table_data.append(['', '', 'Salaire brut:', f"{payslip_data.get('gross_salary', 0):.2f} €"])
            table_data.append(['', '', 'Cotisations salariales:', f"-{payslip_data.get('total_employee_contributions', 0):.2f} €"])
            table_data.append(['', '', 'Cotisations patronales:', f"{payslip_data.get('total_employer_contributions', 0):.2f} €"])
            table_data.append(['', '', '<b>Net à payer:</b>', f"<b>{payslip_data.get('net_salary', 0):.2f} €</b>"])
            
            payslip_table = Table(table_data, colWidths=[8*cm, 3*cm, 3*cm, 2*cm])
            payslip_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -4), 1, colors.black),
                ('LINEABOVE', (0, -4), (-1, -4), 2, colors.black),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ]))
            
            story.append(payslip_table)
            story.append(Spacer(1, 30))
            
            # Mentions légales
            legal_text = """
            <b>Mentions légales:</b><br/>
            Ce bulletin de paie est conforme à la réglementation française.<br/>
            Les cotisations sont calculées selon les taux en vigueur.<br/>
            En cas de litige, se référer au Code du travail.
            """
            story.append(Paragraph(legal_text, self.styles['Normal']))
            
            # Générer le PDF
            doc.build(story)
            
            logger.info(f"Payslip PDF generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating payslip PDF: {e}")
            raise


# Instance globale du générateur
pdf_generator = PDFGenerator()
