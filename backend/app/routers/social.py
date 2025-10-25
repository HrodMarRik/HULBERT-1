"""
Routeur API pour la gestion des déclarations sociales
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from ..db import get_db
from ..models import User, SocialCharge, TaxDeclaration
from ..schemas import (
    SocialChargeCreate, SocialChargeUpdate, SocialChargeResponse,
    TaxDeclarationCreate, TaxDeclarationUpdate, TaxDeclarationResponse
)
from ..security import get_current_user
from ..services.social_service import SocialService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/social", tags=["social"])

# Initialize service
social_service = SocialService()


# =============================================================================
# SOCIAL CHARGE ENDPOINTS
# =============================================================================

@router.post("/charges", response_model=SocialChargeResponse)
async def create_social_charge(
    charge_data: SocialChargeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new social charge"""
    try:
        logger.info(f"User {current_user.id} creating social charge: {charge_data.name}")
        
        social_charge = social_service.create_social_charge(db, charge_data)
        
        logger.info(f"Social charge created: {social_charge.name}")
        return social_charge
    except Exception as e:
        logger.error(f"Error creating social charge: {e}")
        raise HTTPException(status_code=500, detail="Error creating social charge")

@router.get("/charges", response_model=List[SocialChargeResponse])
async def get_social_charges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    organism: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    period_year: Optional[int] = Query(None),
    period_month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get social charges with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting social charges with period {period_year}/{period_month}")
        
        # Get social charges with all parameters
        social_charges = social_service.get_social_charges(
            db, skip, limit, organism, is_active, period_year, period_month
        )
        
        logger.info(f"Found {len(social_charges)} social charges")
        return social_charges
    except Exception as e:
        logger.error(f"Error getting social charges: {e}")
        raise HTTPException(status_code=500, detail="Error fetching social charges")

@router.get("/charges/{charge_id}", response_model=SocialChargeResponse)
async def get_social_charge(
    charge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get social charge by ID"""
    try:
        logger.info(f"User {current_user.id} requesting social charge {charge_id}")
        
        social_charge = social_service.get_social_charge(db, charge_id)
        if not social_charge:
            raise HTTPException(status_code=404, detail="Social charge not found")
        
        return social_charge
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting social charge: {e}")
        raise HTTPException(status_code=500, detail="Error fetching social charge")

@router.put("/charges/{charge_id}", response_model=SocialChargeResponse)
async def update_social_charge(
    charge_id: int,
    charge_data: SocialChargeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a social charge"""
    try:
        logger.info(f"User {current_user.id} updating social charge {charge_id}")
        
        social_charge = social_service.update_social_charge(db, charge_id, charge_data)
        if not social_charge:
            raise HTTPException(status_code=404, detail="Social charge not found")
        
        logger.info(f"Social charge updated: {social_charge.name}")
        return social_charge
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating social charge: {e}")
        raise HTTPException(status_code=500, detail="Error updating social charge")

@router.delete("/charges/{charge_id}")
async def delete_social_charge(
    charge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a social charge"""
    try:
        logger.info(f"User {current_user.id} deleting social charge {charge_id}")
        
        success = social_service.delete_social_charge(db, charge_id)
        if not success:
            raise HTTPException(status_code=404, detail="Social charge not found")
        
        logger.info(f"Social charge deleted: {charge_id}")
        return {"message": "Social charge deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting social charge: {e}")
        raise HTTPException(status_code=500, detail="Error deleting social charge")


# =============================================================================
# TAX DECLARATION ENDPOINTS
# =============================================================================

@router.post("/declarations", response_model=TaxDeclarationResponse)
async def create_tax_declaration(
    declaration_data: TaxDeclarationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tax declaration"""
    try:
        logger.info(f"User {current_user.id} creating tax declaration: {declaration_data.declaration_type}")
        
        tax_declaration = social_service.create_tax_declaration(db, declaration_data, current_user.id)
        
        logger.info(f"Tax declaration created: {tax_declaration.declaration_type}")
        return tax_declaration
    except Exception as e:
        logger.error(f"Error creating tax declaration: {e}")
        raise HTTPException(status_code=500, detail="Error creating tax declaration")

@router.get("/declarations", response_model=List[TaxDeclarationResponse])
async def get_tax_declarations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    declaration_type: Optional[str] = Query(None),
    period_year: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tax declarations with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting tax declarations")
        
        tax_declarations = social_service.get_tax_declarations(db, skip, limit, declaration_type, period_year, status)
        
        logger.info(f"Found {len(tax_declarations)} tax declarations")
        return tax_declarations
    except Exception as e:
        logger.error(f"Error getting tax declarations: {e}")
        raise HTTPException(status_code=500, detail="Error fetching tax declarations")

@router.get("/declarations/{declaration_id}", response_model=TaxDeclarationResponse)
async def get_tax_declaration(
    declaration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tax declaration by ID"""
    try:
        logger.info(f"User {current_user.id} requesting tax declaration {declaration_id}")
        
        tax_declaration = social_service.get_tax_declaration(db, declaration_id)
        if not tax_declaration:
            raise HTTPException(status_code=404, detail="Tax declaration not found")
        
        return tax_declaration
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tax declaration: {e}")
        raise HTTPException(status_code=500, detail="Error fetching tax declaration")

@router.put("/declarations/{declaration_id}", response_model=TaxDeclarationResponse)
async def update_tax_declaration(
    declaration_id: int,
    declaration_data: TaxDeclarationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a tax declaration"""
    try:
        logger.info(f"User {current_user.id} updating tax declaration {declaration_id}")
        
        tax_declaration = social_service.update_tax_declaration(db, declaration_id, declaration_data, current_user.id)
        if not tax_declaration:
            raise HTTPException(status_code=404, detail="Tax declaration not found")
        
        logger.info(f"Tax declaration updated: {tax_declaration.declaration_type}")
        return tax_declaration
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tax declaration: {e}")
        raise HTTPException(status_code=500, detail="Error updating tax declaration")

@router.delete("/declarations/{declaration_id}")
async def delete_tax_declaration(
    declaration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a tax declaration"""
    try:
        logger.info(f"User {current_user.id} deleting tax declaration {declaration_id}")
        
        success = social_service.delete_tax_declaration(db, declaration_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tax declaration not found")
        
        logger.info(f"Tax declaration deleted: {declaration_id}")
        return {"message": "Tax declaration deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tax declaration: {e}")
        raise HTTPException(status_code=500, detail="Error deleting tax declaration")


# =============================================================================
# DECLARATION GENERATION ENDPOINTS
# =============================================================================

@router.post("/dsn/generate")
async def generate_dsn(
    period_year: int,
    period_month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate DSN (Déclaration Sociale Nominative) file"""
    try:
        logger.info(f"User {current_user.id} generating DSN for {period_month:02d}/{period_year}")
        
        dsn_data = social_service.generate_dsn(db, period_year, period_month)
        
        logger.info(f"DSN generated for {period_month:02d}/{period_year}")
        return dsn_data
    except Exception as e:
        logger.error(f"Error generating DSN: {e}")
        raise HTTPException(status_code=500, detail="Error generating DSN")

@router.post("/urssaf/generate")
async def generate_urssaf_declaration(
    period_year: int,
    period_month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate URSSAF declaration"""
    try:
        logger.info(f"User {current_user.id} generating URSSAF declaration for {period_month:02d}/{period_year}")
        
        urssaf_data = social_service.generate_urssaf_declaration(db, period_year, period_month)
        
        logger.info(f"URSSAF declaration generated for {period_month:02d}/{period_year}")
        return urssaf_data
    except Exception as e:
        logger.error(f"Error generating URSSAF declaration: {e}")
        raise HTTPException(status_code=500, detail="Error generating URSSAF declaration")

@router.get("/charges/summary")
async def get_social_charges_summary(
    period_year: int,
    period_month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get social charges summary for a period"""
    try:
        logger.info(f"User {current_user.id} requesting social charges summary for {period_month:02d}/{period_year}")
        
        summary = social_service.get_social_charges_summary(db, period_year, period_month)
        
        logger.info(f"Social charges summary generated for {period_month:02d}/{period_year}")
        return summary
    except Exception as e:
        logger.error(f"Error generating social charges summary: {e}")
        raise HTTPException(status_code=500, detail="Error generating social charges summary")

@router.get("/calendar/{year}")
async def get_declaration_calendar(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get declaration calendar for a year"""
    try:
        logger.info(f"User {current_user.id} requesting declaration calendar for {year}")
        
        calendar = social_service.get_declaration_calendar(db, year)
        
        logger.info(f"Declaration calendar generated for {year}")
        return calendar
    except Exception as e:
        logger.error(f"Error generating declaration calendar: {e}")
        raise HTTPException(status_code=500, detail="Error generating declaration calendar")