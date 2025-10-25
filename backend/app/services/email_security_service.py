import logging
import hashlib
import requests
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import MonitoredEmail, EmailSecurityCheck, EmailSecurityAlert
from app.schemas import MonitoredEmailCreate, MonitoredEmailUpdate

logger = logging.getLogger(__name__)


class EmailSecurityService:
    def __init__(self, db: Session):
        self.db = db
        self.haveibeenpwned_api = "https://api.pwnedpasswords.com/range/"

    # --- Monitored Emails ---
    def create_monitored_email(self, email: MonitoredEmailCreate, user_id: int) -> MonitoredEmail:
        """Ajouter un email à surveiller"""
        db_email = MonitoredEmail(**email.dict(), user_id=user_id)
        self.db.add(db_email)
        self.db.commit()
        self.db.refresh(db_email)
        
        # Perform initial check
        self.check_email_security(db_email.id, user_id)
        
        return db_email

    def get_monitored_emails(self, user_id: int, active_only: bool = False) -> List[MonitoredEmail]:
        """Liste des emails surveillés"""
        query = self.db.query(MonitoredEmail).filter(MonitoredEmail.user_id == user_id)
        
        if active_only:
            query = query.filter(MonitoredEmail.active == True)
        
        return query.order_by(MonitoredEmail.created_at.desc()).all()

    def get_monitored_email(self, email_id: int, user_id: int) -> Optional[MonitoredEmail]:
        """Obtenir un email surveillé"""
        return self.db.query(MonitoredEmail).filter(
            MonitoredEmail.id == email_id,
            MonitoredEmail.user_id == user_id
        ).first()

    def update_monitored_email(self, email_id: int, email: MonitoredEmailUpdate, user_id: int) -> Optional[MonitoredEmail]:
        """Mettre à jour un email surveillé"""
        db_email = self.get_monitored_email(email_id, user_id)
        if not db_email:
            return None
        
        for key, value in email.dict(exclude_unset=True).items():
            setattr(db_email, key, value)
        
        self.db.commit()
        self.db.refresh(db_email)
        return db_email

    def delete_monitored_email(self, email_id: int, user_id: int) -> bool:
        """Supprimer un email surveillé"""
        db_email = self.get_monitored_email(email_id, user_id)
        if not db_email:
            return False
        
        self.db.delete(db_email)
        self.db.commit()
        return True

    # --- Security Checks ---
    def check_email_security(self, email_id: int, user_id: int) -> Optional[EmailSecurityCheck]:
        """Vérifier la sécurité d'un email via HaveIBeenPwned"""
        db_email = self.get_monitored_email(email_id, user_id)
        if not db_email:
            return None
        
        try:
            # Use k-anonymity for privacy
            email_hash = hashlib.sha1(db_email.email.lower().encode()).hexdigest().upper()
            prefix = email_hash[:5]
            suffix = email_hash[5:]
            
            # Check HaveIBeenPwned API
            response = requests.get(f"{self.haveibeenpwned_api}{prefix}", timeout=10)
            
            if response.status_code == 200:
                breaches = []
                breach_count = 0
                
                for line in response.text.splitlines():
                    if line.startswith(suffix):
                        count = int(line.split(':')[1])
                        breach_count += count
                        breaches.append({
                            "hash_suffix": suffix,
                            "count": count
                        })
                
                is_compromised = breach_count > 0
                
                # Create check record
                check = EmailSecurityCheck(
                    monitored_email_id=email_id,
                    is_compromised=is_compromised,
                    breach_count=breach_count,
                    breach_details=breaches if breaches else None
                )
                
                self.db.add(check)
                self.db.commit()
                self.db.refresh(check)
                
                # Create alert if compromised
                if is_compromised:
                    self.create_alert(check.id)
                
                logger.info(f"Security check completed for {db_email.email}: {breach_count} breaches")
                return check
                
            else:
                logger.error(f"HaveIBeenPwned API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error checking email security for {db_email.email}: {e}")
            return None

    def get_security_checks(self, user_id: int, email_id: Optional[int] = None, limit: int = 50) -> List[EmailSecurityCheck]:
        """Historique des vérifications"""
        query = self.db.query(EmailSecurityCheck).join(MonitoredEmail).filter(
            MonitoredEmail.user_id == user_id
        )
        
        if email_id:
            query = query.filter(EmailSecurityCheck.monitored_email_id == email_id)
        
        return query.order_by(EmailSecurityCheck.checked_at.desc()).limit(limit).all()

    def get_latest_check(self, email_id: int, user_id: int) -> Optional[EmailSecurityCheck]:
        """Dernière vérification pour un email"""
        return self.db.query(EmailSecurityCheck).join(MonitoredEmail).filter(
            EmailSecurityCheck.monitored_email_id == email_id,
            MonitoredEmail.user_id == user_id
        ).order_by(EmailSecurityCheck.checked_at.desc()).first()

    # --- Alerts ---
    def create_alert(self, check_id: int) -> EmailSecurityAlert:
        """Créer une alerte de sécurité"""
        alert = EmailSecurityAlert(check_id=check_id)
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_alerts(self, user_id: int, acknowledged: Optional[bool] = None) -> List[EmailSecurityAlert]:
        """Liste des alertes"""
        query = self.db.query(EmailSecurityAlert).join(EmailSecurityCheck).join(MonitoredEmail).filter(
            MonitoredEmail.user_id == user_id
        )
        
        if acknowledged is not None:
            query = query.filter(EmailSecurityAlert.acknowledged == acknowledged)
        
        return query.order_by(EmailSecurityAlert.sent_at.desc()).all()

    def acknowledge_alert(self, alert_id: int, user_id: int) -> Optional[EmailSecurityAlert]:
        """Acquitter une alerte"""
        alert = self.db.query(EmailSecurityAlert).join(EmailSecurityCheck).join(MonitoredEmail).filter(
            EmailSecurityAlert.id == alert_id,
            MonitoredEmail.user_id == user_id
        ).first()
        
        if not alert:
            return None
        
        alert.acknowledged = True
        self.db.commit()
        self.db.refresh(alert)
        return alert

    # --- Auto Checks ---
    def auto_check_all(self) -> None:
        """Vérification automatique de tous les emails actifs (pour job background)"""
        emails = self.db.query(MonitoredEmail).filter(MonitoredEmail.active == True).all()
        
        for email in emails:
            # Check if it's time for a check based on frequency
            latest_check = self.get_latest_check(email.id, email.user_id)
            
            if latest_check:
                time_since_check = datetime.utcnow() - latest_check.checked_at
                
                if email.check_frequency == "daily" and time_since_check < timedelta(days=1):
                    continue
                elif email.check_frequency == "weekly" and time_since_check < timedelta(weeks=1):
                    continue
                elif email.check_frequency == "monthly" and time_since_check < timedelta(days=30):
                    continue
            
            try:
                self.check_email_security(email.id, email.user_id)
            except Exception as e:
                logger.error(f"Error auto-checking email {email.email}: {e}")

    # --- Stats ---
    def get_stats(self, user_id: int) -> Dict[str, Any]:
        """Statistiques de sécurité email"""
        total_monitored = self.db.query(MonitoredEmail).filter(MonitoredEmail.user_id == user_id).count()
        active_monitored = self.db.query(MonitoredEmail).filter(
            MonitoredEmail.user_id == user_id,
            MonitoredEmail.active == True
        ).count()
        
        # Count compromised emails
        compromised_emails = self.db.query(MonitoredEmail).join(EmailSecurityCheck).filter(
            MonitoredEmail.user_id == user_id,
            EmailSecurityCheck.is_compromised == True
        ).distinct().count()
        
        total_checks = self.db.query(EmailSecurityCheck).join(MonitoredEmail).filter(
            MonitoredEmail.user_id == user_id
        ).count()
        
        unacknowledged_alerts = self.db.query(EmailSecurityAlert).join(EmailSecurityCheck).join(MonitoredEmail).filter(
            MonitoredEmail.user_id == user_id,
            EmailSecurityAlert.acknowledged == False
        ).count()
        
        return {
            "total_monitored": total_monitored,
            "active_monitored": active_monitored,
            "compromised_emails": compromised_emails,
            "total_checks": total_checks,
            "unacknowledged_alerts": unacknowledged_alerts
        }
