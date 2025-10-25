from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class BudgetTransaction(Base):
    __tablename__ = "budget_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # 'income' or 'expense'
    category = Column(String(50), nullable=False)  # 'labor', 'materials', 'equipment', etc.
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    description = Column(Text, nullable=False)
    vendor_name = Column(String(200))
    invoice_number = Column(String(100))
    transaction_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'approved', 'paid', 'rejected'
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="budget_transactions")
    created_by = relationship("User", back_populates="created_budget_transactions")

class BudgetAlert(Base):
    __tablename__ = "budget_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # 'budget_threshold', 'overspend_warning', etc.
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)  # 'low', 'medium', 'high', 'critical'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="budget_alerts")
