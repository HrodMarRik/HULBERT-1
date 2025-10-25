import logging
import logging.handlers
import os
from datetime import datetime
from typing import Optional
import json

class AccountingLogger:
    """Logger centralisé pour le système comptable"""
    
    def __init__(self):
        self.log_dir = "backend/logs"
        self._ensure_log_directory()
        self._setup_loggers()
    
    def _ensure_log_directory(self):
        """Crée le dossier de logs s'il n'existe pas"""
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
    
    def _setup_loggers(self):
        """Configure tous les loggers du système"""
        
        # Format commun pour tous les logs
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)-15s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Logger principal API
        self.api_logger = self._create_logger(
            'api',
            f'{self.log_dir}/api_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter
        )
        
        # Logger comptabilité
        self.accounting_logger = self._create_logger(
            'accounting',
            f'{self.log_dir}/accounting_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter
        )
        
        # Logger paie
        self.payroll_logger = self._create_logger(
            'payroll',
            f'{self.log_dir}/payroll_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter
        )
        
        # Logger facturation
        self.invoicing_logger = self._create_logger(
            'invoicing',
            f'{self.log_dir}/invoicing_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter
        )
        
        # Logger déclarations sociales
        self.social_logger = self._create_logger(
            'social',
            f'{self.log_dir}/social_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter
        )
        
        # Logger erreurs uniquement
        self.error_logger = self._create_logger(
            'errors',
            f'{self.log_dir}/errors_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter,
            level=logging.ERROR
        )
        
        # Logger debug (détaillé)
        self.debug_logger = self._create_logger(
            'debug',
            f'{self.log_dir}/debug_{datetime.now().strftime("%Y-%m-%d")}.log',
            formatter,
            level=logging.DEBUG
        )
    
    def _create_logger(self, name: str, filename: str, formatter: logging.Formatter, level: int = logging.INFO):
        """Crée un logger avec rotation de fichiers"""
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # Éviter les doublons
        if logger.handlers:
            return logger
        
        # Handler fichier avec rotation quotidienne
        file_handler = logging.handlers.TimedRotatingFileHandler(
            filename,
            when='midnight',
            interval=1,
            backupCount=30,  # Garde 30 jours
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        # Handler console pour le développement
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        return logger
    
    def log_api_request(self, method: str, url: str, status_code: int, duration: float, user_id: Optional[int] = None):
        """Log une requête API"""
        message = f"{method} {url} | Status: {status_code} | Duration: {duration:.3f}s"
        if user_id:
            message += f" | User: {user_id}"
        
        if status_code >= 400:
            self.api_logger.warning(message)
        else:
            self.api_logger.info(message)
    
    def log_accounting_entry(self, action: str, entry_id: Optional[int] = None, user_id: Optional[int] = None, details: Optional[dict] = None):
        """Log une action comptable"""
        message = f"Accounting {action}"
        if entry_id:
            message += f" | Entry ID: {entry_id}"
        if user_id:
            message += f" | User: {user_id}"
        if details:
            message += f" | Details: {json.dumps(details, ensure_ascii=False)}"
        
        self.accounting_logger.info(message)
    
    def log_invoice_action(self, action: str, invoice_id: Optional[int] = None, amount: Optional[float] = None, user_id: Optional[int] = None):
        """Log une action de facturation"""
        message = f"Invoice {action}"
        if invoice_id:
            message += f" | Invoice ID: {invoice_id}"
        if amount:
            message += f" | Amount: {amount:.2f}€"
        if user_id:
            message += f" | User: {user_id}"
        
        self.invoicing_logger.info(message)
    
    def log_payroll_calculation(self, employee_id: int, period: str, gross_salary: float, net_salary: float, user_id: Optional[int] = None):
        """Log un calcul de paie"""
        message = f"Payroll calculation | Employee: {employee_id} | Period: {period} | Gross: {gross_salary:.2f}€ | Net: {net_salary:.2f}€"
        if user_id:
            message += f" | User: {user_id}"
        
        self.payroll_logger.info(message)
    
    def log_social_declaration(self, action: str, period: str, total_amount: Optional[float] = None, user_id: Optional[int] = None):
        """Log une déclaration sociale"""
        message = f"Social declaration {action} | Period: {period}"
        if total_amount:
            message += f" | Total: {total_amount:.2f}€"
        if user_id:
            message += f" | User: {user_id}"
        
        self.social_logger.info(message)
    
    def log_error(self, error: Exception, context: Optional[str] = None, user_id: Optional[int] = None):
        """Log une erreur"""
        message = f"ERROR: {str(error)}"
        if context:
            message += f" | Context: {context}"
        if user_id:
            message += f" | User: {user_id}"
        
        self.error_logger.error(message, exc_info=True)
    
    def log_debug(self, message: str, module: str = "general", data: Optional[dict] = None):
        """Log de debug détaillé"""
        debug_message = f"[{module}] {message}"
        if data:
            debug_message += f" | Data: {json.dumps(data, ensure_ascii=False)}"
        
        self.debug_logger.debug(debug_message)

# Instance globale
accounting_logger = AccountingLogger()