from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PayrollCalculator:
    """
    Calculateur de paie avec cotisations sociales françaises conformes à la réglementation URSSAF
    """
    
    def __init__(self):
        # Cotisations sociales françaises 2024 (taux en pourcentage)
        self.social_contributions = {
            # Cotisations salariales
            "csg_deductible": {"rate": 2.40, "ceiling": None, "type": "employee"},
            "csg_non_deductible": {"rate": 2.90, "ceiling": None, "type": "employee"},
            "crds": {"rate": 0.50, "ceiling": None, "type": "employee"},
            "assurance_chomage": {"rate": 2.40, "ceiling": 13284.00, "type": "employee"},
            "assurance_vieillesse": {"rate": 0.75, "ceiling": 13284.00, "type": "employee"},
            "retraite_complementaire_arrco": {"rate": 3.15, "ceiling": 13284.00, "type": "employee"},
            "retraite_complementaire_agirc": {"rate": 4.72, "ceiling": 13284.00, "type": "employee"},
            "prevoyance": {"rate": 1.00, "ceiling": 13284.00, "type": "employee"},
            "mutuelle": {"rate": 0.00, "ceiling": None, "type": "employee"},  # Variable selon contrat
            
            # Cotisations patronales
            "assurance_chomage_patronale": {"rate": 4.05, "ceiling": 13284.00, "type": "employer"},
            "assurance_vieillesse_patronale": {"rate": 1.90, "ceiling": 13284.00, "type": "employer"},
            "retraite_complementaire_arrco_patronale": {"rate": 4.72, "ceiling": 13284.00, "type": "employer"},
            "retraite_complementaire_agirc_patronale": {"rate": 7.08, "ceiling": 13284.00, "type": "employer"},
            "prevoyance_patronale": {"rate": 1.50, "ceiling": 13284.00, "type": "employer"},
            "mutuelle_patronale": {"rate": 0.00, "ceiling": None, "type": "employer"},  # Variable selon contrat
            "formation_professionnelle": {"rate": 0.55, "ceiling": None, "type": "employer"},
            "apprentissage": {"rate": 0.68, "ceiling": None, "type": "employer"},
            "fnal": {"rate": 0.10, "ceiling": None, "type": "employer"},
            "accidents_travail": {"rate": 1.20, "ceiling": None, "type": "employer"},
            "famille": {"rate": 3.45, "ceiling": None, "type": "employer"},
            "vieillesse_deplafonnee": {"rate": 1.90, "ceiling": None, "type": "employer"},
        }
        
        # Plafond de la Sécurité Sociale (PMSS) 2024
        self.pmss_2024 = 13284.00
        
        # Réductions de charges pour les petites entreprises
        self.small_company_reductions = {
            "cotisation_familiale": 0.26,  # Réduction de 0.26 point pour entreprises < 20 salariés
        }
    
    def calculate_gross_to_net(self, gross_salary: float, bonuses: List[Dict] = None, 
                              deductions: List[Dict] = None, company_size: str = "large") -> Dict:
        """
        Calcule le salaire net à partir du salaire brut
        
        Args:
            gross_salary: Salaire brut mensuel
            bonuses: Liste des primes (ex: [{"description": "Prime", "amount": 500}])
            deductions: Liste des retenues (ex: [{"description": "Avance", "amount": 200}])
            company_size: Taille de l'entreprise ("small" < 20 salariés, "large" >= 20 salariés)
        
        Returns:
            Dict contenant tous les calculs détaillés
        """
        try:
            logger.info(f"Calculating payroll for gross salary: {gross_salary}")
            
            # Initialiser les montants
            total_gross = Decimal(str(gross_salary))
            total_bonuses = Decimal('0')
            total_deductions = Decimal('0')
            
            # Ajouter les primes
            if bonuses:
                for bonus in bonuses:
                    bonus_amount = Decimal(str(bonus.get('amount', 0)))
                    total_bonuses += bonus_amount
                    total_gross += bonus_amount
            
            # Soustraire les retenues
            if deductions:
                for deduction in deductions:
                    deduction_amount = Decimal(str(deduction.get('amount', 0)))
                    total_deductions += deduction_amount
                    total_gross -= deduction_amount
            
            # Calculer les cotisations
            employee_contributions = self._calculate_employee_contributions(total_gross, company_size)
            employer_contributions = self._calculate_employer_contributions(total_gross, company_size)
            
            # Calculer le net
            net_salary = total_gross - sum(employee_contributions.values())
            
            # Arrondir à 2 décimales
            net_salary = net_salary.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            result = {
                "gross_salary": float(total_gross),
                "bonuses": float(total_bonuses),
                "deductions": float(total_deductions),
                "employee_contributions": {k: float(v) for k, v in employee_contributions.items()},
                "employer_contributions": {k: float(v) for k, v in employer_contributions.items()},
                "total_employee_contributions": float(sum(employee_contributions.values())),
                "total_employer_contributions": float(sum(employer_contributions.values())),
                "net_salary": float(net_salary),
                "total_cost_employer": float(total_gross + sum(employer_contributions.values())),
                "contribution_rate_employee": float(sum(employee_contributions.values()) / total_gross * 100) if total_gross > 0 else 0,
                "contribution_rate_employer": float(sum(employer_contributions.values()) / total_gross * 100) if total_gross > 0 else 0,
            }
            
            logger.info(f"Payroll calculation completed: Net={result['net_salary']}, Total cost={result['total_cost_employer']}")
            return result
            
        except Exception as e:
            logger.error(f"Error calculating payroll: {e}")
            raise
    
    def _calculate_employee_contributions(self, gross_salary: Decimal, company_size: str) -> Dict[str, Decimal]:
        """Calcule les cotisations salariales"""
        contributions = {}
        
        for name, config in self.social_contributions.items():
            if config["type"] != "employee":
                continue
                
            rate = Decimal(str(config["rate"]))
            ceiling = Decimal(str(config["ceiling"])) if config["ceiling"] else None
            
            # Appliquer le plafond si applicable
            base_amount = gross_salary
            if ceiling:
                base_amount = min(base_amount, ceiling)
            
            # Calculer la cotisation
            contribution = base_amount * rate / Decimal('100')
            contributions[name] = contribution.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        return contributions
    
    def _calculate_employer_contributions(self, gross_salary: Decimal, company_size: str) -> Dict[str, Decimal]:
        """Calcule les cotisations patronales"""
        contributions = {}
        
        for name, config in self.social_contributions.items():
            if config["type"] != "employer":
                continue
                
            rate = Decimal(str(config["rate"]))
            ceiling = Decimal(str(config["ceiling"])) if config["ceiling"] else None
            
            # Appliquer le plafond si applicable
            base_amount = gross_salary
            if ceiling:
                base_amount = min(base_amount, ceiling)
            
            # Appliquer les réductions pour petites entreprises
            if company_size == "small" and name in self.small_company_reductions:
                rate -= Decimal(str(self.small_company_reductions[name]))
            
            # Calculer la cotisation
            contribution = base_amount * rate / Decimal('100')
            contributions[name] = contribution.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        return contributions
    
    def generate_payslip_lines(self, calculation_result: Dict) -> List[Dict]:
        """Génère les lignes de bulletin de paie à partir du calcul"""
        lines = []
        order = 0
        
        # Salaire brut
        lines.append({
            "line_type": "gross",
            "description": "Salaire brut",
            "base_amount": calculation_result["gross_salary"],
            "rate_percentage": None,
            "amount": calculation_result["gross_salary"],
            "display_order": order
        })
        order += 1
        
        # Primes
        if calculation_result["bonuses"] > 0:
            lines.append({
                "line_type": "bonus",
                "description": "Primes",
                "base_amount": calculation_result["bonuses"],
                "rate_percentage": None,
                "amount": calculation_result["bonuses"],
                "display_order": order
            })
            order += 1
        
        # Retenues
        if calculation_result["deductions"] > 0:
            lines.append({
                "line_type": "deduction",
                "description": "Retenues",
                "base_amount": calculation_result["deductions"],
                "rate_percentage": None,
                "amount": calculation_result["deductions"],
                "display_order": order
            })
            order += 1
        
        # Cotisations salariales
        for name, amount in calculation_result["employee_contributions"].items():
            if amount > 0:
                lines.append({
                    "line_type": "employee_contribution",
                    "description": self._get_contribution_description(name),
                    "base_amount": calculation_result["gross_salary"],
                    "rate_percentage": self.social_contributions[name]["rate"],
                    "amount": amount,
                    "display_order": order
                })
                order += 1
        
        # Cotisations patronales (pour information, pas déduites du salaire)
        for name, amount in calculation_result["employer_contributions"].items():
            if amount > 0:
                lines.append({
                    "line_type": "employer_contribution",
                    "description": self._get_contribution_description(name),
                    "base_amount": calculation_result["gross_salary"],
                    "rate_percentage": self.social_contributions[name]["rate"],
                    "amount": amount,
                    "display_order": order
                })
                order += 1
        
        # Salaire net
        lines.append({
            "line_type": "net",
            "description": "Salaire net à payer",
            "base_amount": calculation_result["net_salary"],
            "rate_percentage": None,
            "amount": calculation_result["net_salary"],
            "display_order": order
        })
        
        return lines
    
    def _get_contribution_description(self, contribution_name: str) -> str:
        """Retourne la description française de la cotisation"""
        descriptions = {
            "csg_deductible": "CSG déductible",
            "csg_non_deductible": "CSG non déductible",
            "crds": "CRDS",
            "assurance_chomage": "Assurance chômage",
            "assurance_vieillesse": "Assurance vieillesse",
            "retraite_complementaire_arrco": "Retraite complémentaire ARRCO",
            "retraite_complementaire_agirc": "Retraite complémentaire AGIRC",
            "prevoyance": "Prévoyance",
            "mutuelle": "Mutuelle",
            "assurance_chomage_patronale": "Assurance chômage (employeur)",
            "assurance_vieillesse_patronale": "Assurance vieillesse (employeur)",
            "retraite_complementaire_arrco_patronale": "Retraite complémentaire ARRCO (employeur)",
            "retraite_complementaire_agirc_patronale": "Retraite complémentaire AGIRC (employeur)",
            "prevoyance_patronale": "Prévoyance (employeur)",
            "mutuelle_patronale": "Mutuelle (employeur)",
            "formation_professionnelle": "Formation professionnelle",
            "apprentissage": "Apprentissage",
            "fnal": "FNAL",
            "accidents_travail": "Accidents du travail",
            "famille": "Famille",
            "vieillesse_deplafonnee": "Vieillesse déplafonnée",
        }
        return descriptions.get(contribution_name, contribution_name)
    
    def validate_payslip_calculation(self, calculation_result: Dict) -> List[str]:
        """Valide les calculs de paie et retourne les avertissements"""
        warnings = []
        
        # Vérifier que le net n'est pas négatif
        if calculation_result["net_salary"] < 0:
            warnings.append("ATTENTION: Le salaire net est négatif")
        
        # Vérifier les taux de cotisation
        employee_rate = calculation_result["contribution_rate_employee"]
        employer_rate = calculation_result["contribution_rate_employer"]
        
        if employee_rate < 20 or employee_rate > 30:
            warnings.append(f"Taux de cotisations salariales inhabituel: {employee_rate:.2f}%")
        
        if employer_rate < 30 or employer_rate > 50:
            warnings.append(f"Taux de cotisations patronales inhabituel: {employer_rate:.2f}%")
        
        # Vérifier le coût total pour l'employeur
        total_cost = calculation_result["total_cost_employer"]
        gross_salary = calculation_result["gross_salary"]
        
        if total_cost / gross_salary > 1.8:  # Plus de 80% de charges
            warnings.append("Charges patronales très élevées")
        
        return warnings
    
    def get_contribution_summary(self, calculation_result: Dict) -> Dict:
        """Retourne un résumé des cotisations par catégorie"""
        summary = {
            "salariales": {
                "total": calculation_result["total_employee_contributions"],
                "breakdown": calculation_result["employee_contributions"]
            },
            "patronales": {
                "total": calculation_result["total_employer_contributions"],
                "breakdown": calculation_result["employer_contributions"]
            },
            "totales": {
                "total": calculation_result["total_employee_contributions"] + calculation_result["total_employer_contributions"],
                "rate": calculation_result["contribution_rate_employee"] + calculation_result["contribution_rate_employer"]
            }
        }
        
        return summary


# Instance globale du calculateur
payroll_calculator = PayrollCalculator()
