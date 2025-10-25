"""
Service de paie avec calculs automatiques des cotisations sociales
"""
import logging
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from app.models import Employee, PayrollEntry, SocialCharge
from app.schemas import PayrollEntryCreate, PayrollEntryUpdate, PayrollEntryResponse, EmployeeResponse
from app.services.pdf_generator_service import PDFGeneratorService

logger = logging.getLogger(__name__)


class PayrollService:
    def __init__(self):
        self.pdf_service = PDFGeneratorService()
        # Barèmes 2024 des cotisations sociales françaises
        self.social_charges_rates = {
            "maladie": {"employee": 0.75, "employer": 7.0},
            "vieillesse": {"employee": 6.9, "employer": 9.9},
            "chomage": {"employee": 2.4, "employer": 4.05},
            "retraite_complementaire": {"employee": 3.15, "employer": 4.72},
            "prevoyance": {"employee": 0.0, "employer": 1.5},
            "formation": {"employee": 0.0, "employer": 0.25},
            "csg": {"employee": 2.4, "employer": 0.0},
            "crds": {"employee": 0.5, "employer": 0.0},
            "apic": {"employee": 0.0, "employer": 0.024},
            "ata": {"employee": 0.0, "employer": 0.1},
            "versement_transport": {"employee": 0.0, "employer": 0.0}  # Variable selon la commune
        }

    def create_employee(self, db: Session, employee_data: dict, user_id: int) -> Employee:
        """Créer un nouvel employé"""
        try:
            employee = Employee(
                first_name=employee_data["first_name"],
                last_name=employee_data["last_name"],
                email=employee_data["email"],
                phone=employee_data.get("phone"),
                birth_date=employee_data.get("birth_date"),
                social_security_number=employee_data.get("social_security_number"),
                address_line1=employee_data.get("address_line1"),
                address_line2=employee_data.get("address_line2"),
                city=employee_data.get("city"),
                postal_code=employee_data.get("postal_code"),
                country=employee_data.get("country", "France"),
                position=employee_data["position"],
                department=employee_data.get("department"),
                employment_type=employee_data.get("employment_type", "CDI"),
                start_date=employee_data["start_date"],
                end_date=employee_data.get("end_date"),
                probation_period_end=employee_data.get("probation_period_end"),
                gross_salary_monthly=employee_data["gross_salary_monthly"],
                working_hours_per_week=employee_data.get("working_hours_per_week", 35.0),
                working_hours_percentage=employee_data.get("working_hours_percentage", 100.0),
                iban=employee_data.get("iban"),
                bic=employee_data.get("bic"),
                manager_id=employee_data.get("manager_id"),
                created_by_user_id=user_id
            )
            
            db.add(employee)
            db.commit()
            db.refresh(employee)
            
            logger.info(f"Employé créé: {employee.first_name} {employee.last_name}")
            return employee
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la création de l'employé: {e}")
            raise

    def update_employee(self, db: Session, employee_id: int, employee_data: dict, user_id: int) -> Optional[Employee]:
        """Mettre à jour un employé"""
        try:
            employee = db.query(Employee).filter(Employee.id == employee_id).first()
            if not employee:
                return None
            
            # Mettre à jour les champs
            for field, value in employee_data.items():
                if hasattr(employee, field) and value is not None:
                    setattr(employee, field, value)
            
            employee.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(employee)
            
            logger.info(f"Employé mis à jour: {employee.first_name} {employee.last_name}")
            return employee
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la mise à jour de l'employé {employee_id}: {e}")
            raise

    def get_employee(self, db: Session, employee_id: int) -> Optional[Employee]:
        """Récupérer un employé par ID"""
        return db.query(Employee).filter(Employee.id == employee_id).first()

    def get_employees(self, db: Session, skip: int = 0, limit: int = 100, 
                     status: Optional[str] = None, department: Optional[str] = None) -> List[Employee]:
        """Récupérer la liste des employés avec filtres"""
        query = db.query(Employee)
        
        if status:
            query = query.filter(Employee.status == status)
        
        if department:
            query = query.filter(Employee.department == department)
        
        return query.order_by(Employee.last_name, Employee.first_name).offset(skip).limit(limit).all()

    def delete_employee(self, db: Session, employee_id: int) -> bool:
        """Supprimer un employé"""
        try:
            employee = db.query(Employee).filter(Employee.id == employee_id).first()
            if not employee:
                return False
            
            db.delete(employee)
            db.commit()
            
            logger.info(f"Employé supprimé: {employee.first_name} {employee.last_name}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la suppression de l'employé {employee_id}: {e}")
            raise

    def calculate_net_salary(self, gross_salary: float, working_hours_percentage: float = 100.0) -> Dict[str, float]:
        """Calculer le salaire net à partir du salaire brut"""
        try:
            # Ajuster le salaire selon le pourcentage de temps de travail
            adjusted_gross = gross_salary * (working_hours_percentage / 100.0)
            
            # Calculer les cotisations salariales
            employee_charges = 0.0
            for charge_name, rates in self.social_charges_rates.items():
                if rates["employee"] > 0:
                    employee_charges += adjusted_gross * rates["employee"] / 100
            
            # Calculer les cotisations patronales
            employer_charges = 0.0
            for charge_name, rates in self.social_charges_rates.items():
                if rates["employer"] > 0:
                    employer_charges += adjusted_gross * rates["employer"] / 100
            
            # Calculer le net à payer
            net_salary = adjusted_gross - employee_charges
            
            return {
                "gross_salary": adjusted_gross,
                "employee_charges": employee_charges,
                "employer_charges": employer_charges,
                "net_salary": net_salary,
                "total_cost": adjusted_gross + employer_charges
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du salaire net: {e}")
            raise

    def generate_payslip(self, db: Session, employee_id: int, period_year: int, period_month: int, 
                        additional_params: Dict[str, Any], user_id: int) -> PayrollEntry:
        """Générer un bulletin de paie"""
        try:
            employee = db.query(Employee).filter(Employee.id == employee_id).first()
            if not employee:
                raise ValueError("Employé non trouvé")
            
            # Vérifier si un bulletin existe déjà pour cette période
            existing_payslip = db.query(PayrollEntry).filter(
                and_(
                    PayrollEntry.employee_id == employee_id,
                    PayrollEntry.period_year == period_year,
                    PayrollEntry.period_month == period_month
                )
            ).first()
            
            if existing_payslip:
                raise ValueError("Un bulletin existe déjà pour cette période")
            
            # Calculer le salaire brut avec les paramètres supplémentaires
            gross_salary = employee.gross_salary_monthly
            hours_worked = additional_params.get("hours_worked", 0.0)
            overtime_hours = additional_params.get("overtime_hours", 0.0)
            overtime_rate = additional_params.get("overtime_rate", 1.25)
            monthly_bonus = additional_params.get("monthly_bonus", 0.0)
            exceptional_bonus = additional_params.get("exceptional_bonus", 0.0)
            meal_vouchers = additional_params.get("meal_vouchers", 0.0)
            transport_allowance = additional_params.get("transport_allowance", 0.0)
            
            # Calculer les heures supplémentaires
            overtime_amount = overtime_hours * (gross_salary / 35) * overtime_rate
            
            # Salaire brut total
            total_gross = gross_salary + overtime_amount + monthly_bonus + exceptional_bonus
            
            # Calculer les cotisations
            salary_calculation = self.calculate_net_salary(total_gross, employee.working_hours_percentage)
            
            # Créer le bulletin de paie
            payslip_data = PayrollEntryCreate(
                employee_id=employee_id,
                period_year=period_year,
                period_month=period_month,
                gross_salary=total_gross,
                hours_worked=hours_worked,
                overtime_hours=overtime_hours,
                overtime_rate=overtime_rate,
                monthly_bonus=monthly_bonus,
                exceptional_bonus=exceptional_bonus,
                meal_vouchers=meal_vouchers,
                transport_allowance=transport_allowance,
                employee_social_charges=salary_calculation["employee_charges"],
                employer_social_charges=salary_calculation["employer_charges"],
                income_tax=0.0,  # À calculer selon le barème fiscal
                other_deductions=0.0,
                net_salary=salary_calculation["net_salary"]
            )
            
            payslip = PayrollEntry(
                employee_id=payslip_data.employee_id,
                period_year=payslip_data.period_year,
                period_month=payslip_data.period_month,
                gross_salary=payslip_data.gross_salary,
                hours_worked=payslip_data.hours_worked,
                overtime_hours=payslip_data.overtime_hours,
                overtime_rate=payslip_data.overtime_rate,
                monthly_bonus=payslip_data.monthly_bonus,
                exceptional_bonus=payslip_data.exceptional_bonus,
                meal_vouchers=payslip_data.meal_vouchers,
                transport_allowance=payslip_data.transport_allowance,
                employee_social_charges=payslip_data.employee_social_charges,
                employer_social_charges=payslip_data.employer_charges,
                income_tax=payslip_data.income_tax,
                other_deductions=payslip_data.other_deductions,
                net_salary=payslip_data.net_salary,
                status="generated",
                created_by_user_id=user_id
            )
            
            db.add(payslip)
            db.commit()
            db.refresh(payslip)
            
            logger.info(f"Bulletin de paie généré pour {employee.first_name} {employee.last_name} - {period_month}/{period_year}")
            return payslip
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la génération du bulletin de paie: {e}")
            raise

    def generate_payslips_batch(self, db: Session, employee_ids: List[int], period_year: int, period_month: int,
                               additional_params: Dict[int, Dict[str, Any]], user_id: int) -> List[PayrollEntry]:
        """Générer plusieurs bulletins de paie en lot"""
        try:
            generated_payslips = []
            
            for employee_id in employee_ids:
                params = additional_params.get(employee_id, {})
                payslip = self.generate_payslip(db, employee_id, period_year, period_month, params, user_id)
                generated_payslips.append(payslip)
            
            logger.info(f"{len(generated_payslips)} bulletins de paie générés pour {period_month}/{period_year}")
            return generated_payslips
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération en lot des bulletins de paie: {e}")
            raise

    def get_payslips(self, db: Session, skip: int = 0, limit: int = 100,
                    employee_id: Optional[int] = None, period_year: Optional[int] = None,
                    period_month: Optional[int] = None, status: Optional[str] = None) -> List[PayrollEntry]:
        """Récupérer la liste des bulletins de paie avec filtres"""
        query = db.query(PayrollEntry)
        
        if employee_id:
            query = query.filter(PayrollEntry.employee_id == employee_id)
        
        if period_year:
            query = query.filter(PayrollEntry.period_year == period_year)
        
        if period_month:
            query = query.filter(PayrollEntry.period_month == period_month)
        
        if status:
            query = query.filter(PayrollEntry.status == status)
        
        return query.order_by(desc(PayrollEntry.created_at)).offset(skip).limit(limit).all()

    def get_payslip(self, db: Session, payslip_id: int) -> Optional[PayrollEntry]:
        """Récupérer un bulletin de paie par ID"""
        return db.query(PayrollEntry).filter(PayrollEntry.id == payslip_id).first()

    def update_payslip(self, db: Session, payslip_id: int, payslip_data: PayrollEntryUpdate, user_id: int) -> Optional[PayrollEntry]:
        """Mettre à jour un bulletin de paie"""
        try:
            payslip = db.query(PayrollEntry).filter(PayrollEntry.id == payslip_id).first()
            if not payslip:
                return None
            
            # Mettre à jour les champs
            update_data = payslip_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(payslip, field, value)
            
            payslip.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(payslip)
            
            logger.info(f"Bulletin de paie mis à jour: {payslip.id}")
            return payslip
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la mise à jour du bulletin de paie {payslip_id}: {e}")
            raise

    def delete_payslip(self, db: Session, payslip_id: int) -> bool:
        """Supprimer un bulletin de paie"""
        try:
            payslip = db.query(PayrollEntry).filter(PayrollEntry.id == payslip_id).first()
            if not payslip:
                return False
            
            db.delete(payslip)
            db.commit()
            
            logger.info(f"Bulletin de paie supprimé: {payslip_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la suppression du bulletin de paie {payslip_id}: {e}")
            raise

    def generate_payslip_pdf(self, db: Session, payslip_id: int) -> bytes:
        """Générer le PDF d'un bulletin de paie"""
        try:
            payslip = db.query(PayrollEntry).filter(PayrollEntry.id == payslip_id).first()
            if not payslip:
                raise ValueError("Bulletin de paie non trouvé")
            
            return self.pdf_service.generate_payslip_pdf(payslip)
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du PDF pour le bulletin de paie {payslip_id}: {e}")
            raise

    def get_payroll_statistics(self, db: Session, period_year: Optional[int] = None, period_month: Optional[int] = None) -> Dict[str, Any]:
        """Récupérer les statistiques de paie"""
        try:
            query = db.query(PayrollEntry)
            
            if period_year:
                query = query.filter(PayrollEntry.period_year == period_year)
            if period_month:
                query = query.filter(PayrollEntry.period_month == period_month)
            
            payslips = query.all()
            
            total_gross = sum(payslip.gross_salary for payslip in payslips)
            total_employee_charges = sum(payslip.employee_social_charges for payslip in payslips)
            total_employer_charges = sum(payslip.employer_social_charges for payslip in payslips)
            total_net = sum(payslip.net_salary for payslip in payslips)
            total_cost = total_gross + total_employer_charges
            
            return {
                "total_payslips": len(payslips),
                "total_gross_salary": total_gross,
                "total_employee_charges": total_employee_charges,
                "total_employer_charges": total_employer_charges,
                "total_net_salary": total_net,
                "total_cost": total_cost,
                "average_gross_salary": total_gross / len(payslips) if payslips else 0,
                "average_net_salary": total_net / len(payslips) if payslips else 0
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des statistiques de paie: {e}")
            raise
