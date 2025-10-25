"""
Service de gestion des déclarations sociales (DSN, URSSAF, etc.)
"""
import logging
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from app.models import SocialCharge, TaxDeclaration, PayrollEntry, Employee
from app.schemas import SocialChargeCreate, SocialChargeUpdate, SocialChargeResponse, TaxDeclarationCreate, TaxDeclarationUpdate, TaxDeclarationResponse

logger = logging.getLogger(__name__)


class SocialService:
    def __init__(self):
        pass

    def create_social_charge(self, db: Session, charge_data: SocialChargeCreate) -> SocialCharge:
        """Créer une nouvelle cotisation sociale"""
        try:
            social_charge = SocialCharge(
                name=charge_data.name,
                charge_type=charge_data.charge_type,
                organism=charge_data.organism,
                employee_rate=charge_data.employee_rate,
                employer_rate=charge_data.employer_rate,
                ceiling_amount=charge_data.ceiling_amount,
                minimum_amount=charge_data.minimum_amount
            )
            
            db.add(social_charge)
            db.commit()
            db.refresh(social_charge)
            
            logger.info(f"Cotisation sociale créée: {social_charge.name}")
            return social_charge
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la création de la cotisation sociale: {e}")
            raise

    def update_social_charge(self, db: Session, charge_id: int, charge_data: SocialChargeUpdate) -> Optional[SocialCharge]:
        """Mettre à jour une cotisation sociale"""
        try:
            social_charge = db.query(SocialCharge).filter(SocialCharge.id == charge_id).first()
            if not social_charge:
                return None
            
            # Mettre à jour les champs
            update_data = charge_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(social_charge, field, value)
            
            social_charge.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(social_charge)
            
            logger.info(f"Cotisation sociale mise à jour: {social_charge.name}")
            return social_charge
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la mise à jour de la cotisation sociale {charge_id}: {e}")
            raise

    def get_social_charges(self, db: Session, skip: int = 0, limit: int = 100, 
                          organism: Optional[str] = None, is_active: Optional[bool] = None,
                          period_year: Optional[int] = None, period_month: Optional[int] = None) -> List[SocialCharge]:
        """Récupérer la liste des cotisations sociales"""
        query = db.query(SocialCharge)
        
        if organism:
            query = query.filter(SocialCharge.organism == organism)
        
        if is_active is not None:
            query = query.filter(SocialCharge.is_active == is_active)
        
        # If period parameters are provided, filter by period
        if period_year and period_month:
            # For now, return all charges as we don't have period-specific data yet
            # In a real implementation, you would filter by the period
            logger.info(f"Filtering social charges for period {period_year}/{period_month}")
        
        return query.order_by(SocialCharge.organism, SocialCharge.name).offset(skip).limit(limit).all()

    def get_social_charge(self, db: Session, charge_id: int) -> Optional[SocialCharge]:
        """Récupérer une cotisation sociale par ID"""
        return db.query(SocialCharge).filter(SocialCharge.id == charge_id).first()

    def delete_social_charge(self, db: Session, charge_id: int) -> bool:
        """Supprimer une cotisation sociale"""
        try:
            social_charge = db.query(SocialCharge).filter(SocialCharge.id == charge_id).first()
            if not social_charge:
                return False
            
            db.delete(social_charge)
            db.commit()
            
            logger.info(f"Cotisation sociale supprimée: {social_charge.name}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la suppression de la cotisation sociale {charge_id}: {e}")
            raise

    def create_tax_declaration(self, db: Session, declaration_data: TaxDeclarationCreate, user_id: int) -> TaxDeclaration:
        """Créer une nouvelle déclaration fiscale"""
        try:
            tax_declaration = TaxDeclaration(
                declaration_type=declaration_data.declaration_type,
                period_year=declaration_data.period_year,
                period_month=declaration_data.period_month,
                period_quarter=declaration_data.period_quarter,
                taxable_amount=declaration_data.taxable_amount,
                tax_amount=declaration_data.tax_amount,
                due_date=declaration_data.due_date,
                reference_number=declaration_data.reference_number,
                notes=declaration_data.notes,
                created_by_user_id=user_id
            )
            
            db.add(tax_declaration)
            db.commit()
            db.refresh(tax_declaration)
            
            logger.info(f"Déclaration fiscale créée: {tax_declaration.declaration_type} - {declaration_data.period_year}")
            return tax_declaration
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la création de la déclaration fiscale: {e}")
            raise

    def update_tax_declaration(self, db: Session, declaration_id: int, declaration_data: TaxDeclarationUpdate, user_id: int) -> Optional[TaxDeclaration]:
        """Mettre à jour une déclaration fiscale"""
        try:
            tax_declaration = db.query(TaxDeclaration).filter(TaxDeclaration.id == declaration_id).first()
            if not tax_declaration:
                return None
            
            # Mettre à jour les champs
            update_data = declaration_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(tax_declaration, field, value)
            
            tax_declaration.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(tax_declaration)
            
            logger.info(f"Déclaration fiscale mise à jour: {tax_declaration.declaration_type}")
            return tax_declaration
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la mise à jour de la déclaration fiscale {declaration_id}: {e}")
            raise

    def get_tax_declarations(self, db: Session, skip: int = 0, limit: int = 100,
                           declaration_type: Optional[str] = None, period_year: Optional[int] = None,
                           status: Optional[str] = None) -> List[TaxDeclaration]:
        """Récupérer la liste des déclarations fiscales"""
        query = db.query(TaxDeclaration)
        
        if declaration_type:
            query = query.filter(TaxDeclaration.declaration_type == declaration_type)
        
        if period_year:
            query = query.filter(TaxDeclaration.period_year == period_year)
        
        if status:
            query = query.filter(TaxDeclaration.status == status)
        
        return query.order_by(desc(TaxDeclaration.due_date)).offset(skip).limit(limit).all()

    def get_tax_declaration(self, db: Session, declaration_id: int) -> Optional[TaxDeclaration]:
        """Récupérer une déclaration fiscale par ID"""
        return db.query(TaxDeclaration).filter(TaxDeclaration.id == declaration_id).first()

    def delete_tax_declaration(self, db: Session, declaration_id: int) -> bool:
        """Supprimer une déclaration fiscale"""
        try:
            tax_declaration = db.query(TaxDeclaration).filter(TaxDeclaration.id == declaration_id).first()
            if not tax_declaration:
                return False
            
            db.delete(tax_declaration)
            db.commit()
            
            logger.info(f"Déclaration fiscale supprimée: {tax_declaration.declaration_type}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la suppression de la déclaration fiscale {declaration_id}: {e}")
            raise

    def generate_dsn(self, db: Session, period_year: int, period_month: int) -> Dict[str, Any]:
        """Générer un fichier DSN (Déclaration Sociale Nominative)"""
        try:
            # Récupérer tous les bulletins de paie de la période
            payslips = db.query(PayrollEntry).filter(
                and_(
                    PayrollEntry.period_year == period_year,
                    PayrollEntry.period_month == period_month
                )
            ).all()
            
            if not payslips:
                raise ValueError("Aucun bulletin de paie trouvé pour cette période")
            
            # Structure du fichier DSN
            dsn_data = {
                "header": {
                    "period": f"{period_year:04d}{period_month:02d}",
                    "declaration_type": "DSN",
                    "employer_siret": "12345678901234",  # À récupérer depuis les paramètres entreprise
                    "generation_date": datetime.utcnow().strftime("%Y%m%d"),
                    "total_employees": len(payslips)
                },
                "employees": []
            }
            
            # Traiter chaque bulletin de paie
            for payslip in payslips:
                employee = payslip.employee
                
                employee_data = {
                    "employee_id": employee.id,
                    "social_security_number": employee.social_security_number,
                    "last_name": employee.last_name,
                    "first_name": employee.first_name,
                    "birth_date": employee.birth_date.strftime("%Y%m%d") if employee.birth_date else None,
                    "gross_salary": payslip.gross_salary,
                    "net_salary": payslip.net_salary,
                    "employee_charges": payslip.employee_social_charges,
                    "employer_charges": payslip.employer_social_charges,
                    "hours_worked": payslip.hours_worked,
                    "overtime_hours": payslip.overtime_hours
                }
                
                dsn_data["employees"].append(employee_data)
            
            logger.info(f"DSN généré pour {period_month:02d}/{period_year} avec {len(payslips)} employés")
            return dsn_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du DSN: {e}")
            raise

    def generate_urssaf_declaration(self, db: Session, period_year: int, period_month: int) -> Dict[str, Any]:
        """Générer une déclaration URSSAF"""
        try:
            # Récupérer tous les bulletins de paie de la période
            payslips = db.query(PayrollEntry).filter(
                and_(
                    PayrollEntry.period_year == period_year,
                    PayrollEntry.period_month == period_month
                )
            ).all()
            
            if not payslips:
                raise ValueError("Aucun bulletin de paie trouvé pour cette période")
            
            # Calculer les totaux des cotisations URSSAF
            total_gross_salary = sum(payslip.gross_salary for payslip in payslips)
            total_employee_charges = sum(payslip.employee_social_charges for payslip in payslips)
            total_employer_charges = sum(payslip.employer_social_charges for payslip in payslips)
            
            # Déclaration URSSAF
            urssaf_data = {
                "header": {
                    "period": f"{period_year:04d}{period_month:02d}",
                    "declaration_type": "URSSAF",
                    "employer_siret": "12345678901234",  # À récupérer depuis les paramètres entreprise
                    "generation_date": datetime.utcnow().strftime("%Y%m%d"),
                    "total_employees": len(payslips)
                },
                "totals": {
                    "gross_salary": total_gross_salary,
                    "employee_charges": total_employee_charges,
                    "employer_charges": total_employer_charges,
                    "total_charges": total_employee_charges + total_employer_charges
                },
                "breakdown": {
                    "maladie": {
                        "employee": total_gross_salary * 0.0075,
                        "employer": total_gross_salary * 0.07
                    },
                    "vieillesse": {
                        "employee": total_gross_salary * 0.069,
                        "employer": total_gross_salary * 0.099
                    },
                    "chomage": {
                        "employee": total_gross_salary * 0.024,
                        "employer": total_gross_salary * 0.0405
                    },
                    "retraite_complementaire": {
                        "employee": total_gross_salary * 0.0315,
                        "employer": total_gross_salary * 0.0472
                    },
                    "prevoyance": {
                        "employee": 0,
                        "employer": total_gross_salary * 0.015
                    },
                    "formation": {
                        "employee": 0,
                        "employer": total_gross_salary * 0.0025
                    },
                    "apic": {
                        "employee": 0,
                        "employer": total_gross_salary * 0.00024
                    },
                    "ata": {
                        "employee": 0,
                        "employer": total_gross_salary * 0.001
                    }
                }
            }
            
            logger.info(f"Déclaration URSSAF générée pour {period_month:02d}/{period_year}")
            return urssaf_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de la déclaration URSSAF: {e}")
            raise

    def get_social_charges_summary(self, db: Session, period_year: int, period_month: int) -> Dict[str, Any]:
        """Récupérer un résumé des cotisations sociales pour une période"""
        try:
            # Récupérer tous les bulletins de paie de la période
            payslips = db.query(PayrollEntry).filter(
                and_(
                    PayrollEntry.period_year == period_year,
                    PayrollEntry.period_month == period_month
                )
            ).all()
            
            if not payslips:
                return {
                    "period": f"{period_month:02d}/{period_year}",
                    "total_employees": 0,
                    "total_gross_salary": 0,
                    "total_employee_charges": 0,
                    "total_employer_charges": 0,
                    "total_cost": 0
                }
            
            total_gross_salary = sum(payslip.gross_salary for payslip in payslips)
            total_employee_charges = sum(payslip.employee_social_charges for payslip in payslips)
            total_employer_charges = sum(payslip.employer_social_charges for payslip in payslips)
            total_cost = total_gross_salary + total_employer_charges
            
            return {
                "period": f"{period_month:02d}/{period_year}",
                "total_employees": len(payslips),
                "total_gross_salary": total_gross_salary,
                "total_employee_charges": total_employee_charges,
                "total_employer_charges": total_employer_charges,
                "total_cost": total_cost,
                "average_gross_salary": total_gross_salary / len(payslips),
                "average_net_salary": sum(payslip.net_salary for payslip in payslips) / len(payslips)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du résumé des cotisations sociales: {e}")
            raise

    def get_declaration_calendar(self, db: Session, year: int) -> List[Dict[str, Any]]:
        """Récupérer le calendrier des déclarations pour une année"""
        try:
            calendar = []
            
            # Déclarations mensuelles (TVA, DSN)
            for month in range(1, 13):
                # TVA - échéance le 25 du mois suivant
                tva_due_date = date(year, month + 1, 25) if month < 12 else date(year + 1, 1, 25)
                calendar.append({
                    "type": "TVA",
                    "period": f"{month:02d}/{year}",
                    "due_date": tva_due_date,
                    "frequency": "mensuel"
                })
                
                # DSN - échéance le 5 du mois suivant
                dsn_due_date = date(year, month + 1, 5) if month < 12 else date(year + 1, 1, 5)
                calendar.append({
                    "type": "DSN",
                    "period": f"{month:02d}/{year}",
                    "due_date": dsn_due_date,
                    "frequency": "mensuel"
                })
            
            # Déclarations trimestrielles (CFE)
            for quarter in [1, 2, 3, 4]:
                quarter_months = [(quarter-1)*3 + 1, (quarter-1)*3 + 2, (quarter-1)*3 + 3]
                last_month = quarter_months[-1]
                cfe_due_date = date(year, last_month + 1, 15) if last_month < 12 else date(year + 1, 1, 15)
                calendar.append({
                    "type": "CFE",
                    "period": f"T{quarter}/{year}",
                    "due_date": cfe_due_date,
                    "frequency": "trimestriel"
                })
            
            # Déclarations annuelles (IS)
            calendar.append({
                "type": "IS",
                "period": f"{year}",
                "due_date": date(year + 1, 5, 15),
                "frequency": "annuel"
            })
            
            # Trier par date d'échéance
            calendar.sort(key=lambda x: x["due_date"])
            
            return calendar
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du calendrier des déclarations: {e}")
            raise
