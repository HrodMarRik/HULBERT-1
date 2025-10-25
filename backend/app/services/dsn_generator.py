from xml.etree.ElementTree import Element, SubElement, tostring
from typing import Dict, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DSNGenerator:
    """
    Générateur de Déclarations Sociales Nominatives (DSN) au format XML
    conforme à la réglementation française
    """
    
    def __init__(self):
        self.dsn_namespace = "http://www.dsn.fr/XML/DSN"
        self.dsn_version = "1.0"
    
    def generate_dsn_xml(self, declaration_data: Dict, payslips_data: List[Dict], 
                        company_info: Dict) -> str:
        """
        Génère un fichier DSN au format XML
        
        Args:
            declaration_data: Données de la déclaration (période, montants, etc.)
            payslips_data: Liste des bulletins de paie pour la période
            company_info: Informations de l'entreprise
        
        Returns:
            Contenu XML de la DSN
        """
        try:
            logger.info(f"Generating DSN XML for period {declaration_data.get('declaration_year')} Q{declaration_data.get('declaration_quarter')}")
            
            # Créer la racine DSN
            root = Element("DSN")
            root.set("xmlns", self.dsn_namespace)
            root.set("version", self.dsn_version)
            
            # En-tête DSN
            self._add_dsn_header(root, declaration_data, company_info)
            
            # Établissement
            self._add_establishment(root, declaration_data, company_info)
            
            # Salariés et bulletins
            self._add_employees_and_payslips(root, payslips_data, declaration_data)
            
            # Synthèse
            self._add_summary(root, declaration_data)
            
            # Convertir en XML
            xml_content = tostring(root, encoding='unicode', method='xml')
            
            # Ajouter la déclaration XML
            xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
            xml_content = xml_declaration + xml_content
            
            logger.info(f"DSN XML generated successfully: {len(xml_content)} characters")
            return xml_content
            
        except Exception as e:
            logger.error(f"Error generating DSN XML: {e}")
            raise
    
    def _add_dsn_header(self, root: Element, declaration_data: Dict, company_info: Dict):
        """Ajoute l'en-tête de la DSN"""
        header = SubElement(root, "EnTeteDSN")
        
        # SIRET de l'entreprise
        SubElement(header, "SIRET").text = company_info.get('siret', '12345678901234')
        
        # Période de déclaration (format AAAAMM)
        period = f"{declaration_data.get('declaration_year', 2024):04d}{declaration_data.get('declaration_quarter', 1):02d}"
        SubElement(header, "Periode").text = period
        
        # Type de déclaration (1 = normale, 2 = rectificative)
        SubElement(header, "TypeDeclaration").text = "1"
        
        # Date de création
        SubElement(header, "DateCreation").text = datetime.now().strftime("%Y-%m-%d")
        
        # Nombre d'établissements
        SubElement(header, "NombreEtablissements").text = "1"
        
        # Nombre de salariés
        SubElement(header, "NombreSalaries").text = str(len(declaration_data.get('payslips_data', [])))
    
    def _add_establishment(self, root: Element, declaration_data: Dict, company_info: Dict):
        """Ajoute les informations de l'établissement"""
        establishment = SubElement(root, "Etablissement")
        
        # SIRET de l'établissement
        SubElement(establishment, "SIRET").text = company_info.get('siret', '12345678901234')
        
        # Période
        period = f"{declaration_data.get('declaration_year', 2024):04d}{declaration_data.get('declaration_quarter', 1):02d}"
        SubElement(establishment, "Periode").text = period
        
        # Informations de l'établissement
        etablissement_info = SubElement(establishment, "EtablissementInfo")
        SubElement(etablissement_info, "RaisonSociale").text = company_info.get('name', 'Votre Entreprise')
        SubElement(etablissement_info, "Adresse").text = company_info.get('address', '')
        SubElement(etablissement_info, "CodePostal").text = company_info.get('postal_code', '')
        SubElement(etablissement_info, "Ville").text = company_info.get('city', '')
        SubElement(etablissement_info, "CodeNAF").text = company_info.get('naf_code', '')
    
    def _add_employees_and_payslips(self, root: Element, payslips_data: List[Dict], declaration_data: Dict):
        """Ajoute les informations des salariés et leurs bulletins"""
        establishment = root.find("Etablissement")
        
        for payslip in payslips_data:
            employee = payslip.get('employee', {})
            
            # Salarié
            salarie = SubElement(establishment, "Salarie")
            
            # Informations du salarié
            salarie_info = SubElement(salarie, "SalarieInfo")
            SubElement(salarie_info, "Matricule").text = str(employee.get('id', ''))
            SubElement(salarie_info, "Nom").text = employee.get('last_name', '')
            SubElement(salarie_info, "Prenom").text = employee.get('first_name', '')
            SubElement(salarie_info, "DateNaissance").text = employee.get('birth_date', '').strftime('%Y-%m-%d') if employee.get('birth_date') else ''
            SubElement(salarie_info, "NumeroSecuriteSociale").text = employee.get('social_security_number', '')
            
            # Contrat
            contrat = SubElement(salarie, "Contrat")
            SubElement(contrat, "TypeContrat").text = employee.get('contract_type', 'CDI')
            SubElement(contrat, "DateDebut").text = employee.get('hire_date', '').strftime('%Y-%m-%d') if employee.get('hire_date') else ''
            SubElement(contrat, "HeuresHebdomadaires").text = str(employee.get('work_hours_per_week', 35))
            
            # Bulletin de paie
            bulletin = SubElement(salarie, "Bulletin")
            SubElement(bulletin, "Periode").text = f"{payslip.get('period_year', 2024):04d}{payslip.get('period_month', 1):02d}"
            
            # Montants
            montants = SubElement(bulletin, "Montants")
            SubElement(montants, "Brut").text = f"{payslip.get('gross_salary', 0):.2f}"
            SubElement(montants, "Net").text = f"{payslip.get('net_salary', 0):.2f}"
            SubElement(montants, "CotisationsSalariales").text = f"{payslip.get('total_employee_contributions', 0):.2f}"
            SubElement(montants, "CotisationsPatronales").text = f"{payslip.get('total_employer_contributions', 0):.2f}"
            
            # Détail des cotisations
            cotisations = SubElement(bulletin, "Cotisations")
            
            for line in payslip.get('payslip_lines', []):
                if line.get('line_type') in ['employee_contribution', 'employer_contribution']:
                    cotisation = SubElement(cotisations, "Cotisation")
                    SubElement(cotisation, "Code").text = line.get('social_contribution', {}).get('code', '')
                    SubElement(cotisation, "Libelle").text = line.get('description', '')
                    SubElement(cotisation, "Base").text = f"{line.get('base_amount', 0):.2f}"
                    SubElement(cotisation, "Taux").text = f"{line.get('rate_percentage', 0):.2f}"
                    SubElement(cotisation, "Montant").text = f"{line.get('amount', 0):.2f}"
                    SubElement(cotisation, "Type").text = "salariale" if line.get('line_type') == 'employee_contribution' else "patronale"
    
    def _add_summary(self, root: Element, declaration_data: Dict):
        """Ajoute la synthèse de la déclaration"""
        establishment = root.find("Etablissement")
        synthese = SubElement(establishment, "Synthese")
        
        # Totaux
        SubElement(synthese, "NombreSalaries").text = str(declaration_data.get('employee_count', 0))
        SubElement(synthese, "TotalBrut").text = f"{declaration_data.get('total_gross_salaries', 0):.2f}"
        SubElement(synthese, "TotalCotisationsSalariales").text = f"{declaration_data.get('total_employee_contributions', 0):.2f}"
        SubElement(synthese, "TotalCotisationsPatronales").text = f"{declaration_data.get('total_employer_contributions', 0):.2f}"
        SubElement(synthese, "TotalCotisations").text = f"{declaration_data.get('total_contributions', 0):.2f}"
        
        # Répartition par type de cotisation
        repartition = SubElement(synthese, "RepartitionCotisations")
        
        # Cotisations salariales
        salariales = SubElement(repartition, "CotisationsSalariales")
        SubElement(salariales, "AssuranceChomage").text = f"{declaration_data.get('employee_chomage', 0):.2f}"
        SubElement(salariales, "AssuranceVieillesse").text = f"{declaration_data.get('employee_vieillesse', 0):.2f}"
        SubElement(salariales, "RetraiteComplementaire").text = f"{declaration_data.get('employee_retraite', 0):.2f}"
        SubElement(salariales, "CSG").text = f"{declaration_data.get('employee_csg', 0):.2f}"
        SubElement(salariales, "CRDS").text = f"{declaration_data.get('employee_crds', 0):.2f}"
        
        # Cotisations patronales
        patronales = SubElement(repartition, "CotisationsPatronales")
        SubElement(patronales, "AssuranceChomage").text = f"{declaration_data.get('employer_chomage', 0):.2f}"
        SubElement(patronales, "AssuranceVieillesse").text = f"{declaration_data.get('employer_vieillesse', 0):.2f}"
        SubElement(patronales, "RetraiteComplementaire").text = f"{declaration_data.get('employer_retraite', 0):.2f}"
        SubElement(patronales, "FormationProfessionnelle").text = f"{declaration_data.get('employer_formation', 0):.2f}"
        SubElement(patronales, "Apprentissage").text = f"{declaration_data.get('employer_apprentissage', 0):.2f}"
        SubElement(patronales, "FNAL").text = f"{declaration_data.get('employer_fnal', 0):.2f}"
        SubElement(patronales, "AccidentsTravail").text = f"{declaration_data.get('employer_accidents', 0):.2f}"
        SubElement(patronales, "Famille").text = f"{declaration_data.get('employer_famille', 0):.2f}"
    
    def validate_dsn_structure(self, xml_content: str) -> List[str]:
        """
        Valide la structure de la DSN XML
        
        Args:
            xml_content: Contenu XML de la DSN
        
        Returns:
            Liste des erreurs de validation
        """
        errors = []
        
        try:
            # Parse XML
            root = Element.fromstring(xml_content)
            
            # Vérifier la racine
            if root.tag != "DSN":
                errors.append("Racine XML doit être 'DSN'")
            
            # Vérifier l'en-tête
            header = root.find("EnTeteDSN")
            if header is None:
                errors.append("En-tête DSN manquant")
            else:
                required_header_fields = ["SIRET", "Periode", "TypeDeclaration", "DateCreation"]
                for field in required_header_fields:
                    if header.find(field) is None:
                        errors.append(f"Champ obligatoire manquant dans l'en-tête: {field}")
            
            # Vérifier l'établissement
            establishment = root.find("Etablissement")
            if establishment is None:
                errors.append("Établissement manquant")
            
            # Vérifier les salariés
            salaries = establishment.findall("Salarie") if establishment is not None else []
            if not salaries:
                errors.append("Aucun salarié trouvé")
            
            # Vérifier la synthèse
            synthese = establishment.find("Synthese") if establishment is not None else None
            if synthese is None:
                errors.append("Synthèse manquante")
            
            logger.info(f"DSN validation completed: {len(errors)} errors found")
            
        except Exception as e:
            errors.append(f"Erreur de parsing XML: {str(e)}")
            logger.error(f"Error validating DSN structure: {e}")
        
        return errors
    
    def get_dsn_statistics(self, xml_content: str) -> Dict:
        """
        Extrait les statistiques de la DSN
        
        Args:
            xml_content: Contenu XML de la DSN
        
        Returns:
            Dictionnaire avec les statistiques
        """
        try:
            root = Element.fromstring(xml_content)
            
            # Compter les salariés
            establishment = root.find("Etablissement")
            salaries = establishment.findall("Salarie") if establishment is not None else []
            
            # Calculer les totaux
            total_brut = 0.0
            total_net = 0.0
            total_cotisations_salariales = 0.0
            total_cotisations_patronales = 0.0
            
            for salarie in salaries:
                bulletin = salarie.find("Bulletin")
                if bulletin is not None:
                    montants = bulletin.find("Montants")
                    if montants is not None:
                        total_brut += float(montants.find("Brut").text or 0)
                        total_net += float(montants.find("Net").text or 0)
                        total_cotisations_salariales += float(montants.find("CotisationsSalariales").text or 0)
                        total_cotisations_patronales += float(montants.find("CotisationsPatronales").text or 0)
            
            statistics = {
                "nombre_salaries": len(salaries),
                "total_brut": total_brut,
                "total_net": total_net,
                "total_cotisations_salariales": total_cotisations_salariales,
                "total_cotisations_patronales": total_cotisations_patronales,
                "total_cotisations": total_cotisations_salariales + total_cotisations_patronales,
                "taux_cotisations_salariales": (total_cotisations_salariales / total_brut * 100) if total_brut > 0 else 0,
                "taux_cotisations_patronales": (total_cotisations_patronales / total_brut * 100) if total_brut > 0 else 0,
            }
            
            logger.info(f"DSN statistics extracted: {statistics}")
            return statistics
            
        except Exception as e:
            logger.error(f"Error extracting DSN statistics: {e}")
            return {}


# Instance globale du générateur
dsn_generator = DSNGenerator()
