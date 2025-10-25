from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..db import get_db
from ..models import CompanyContact, Company, Contact, User
from ..security import get_current_user
from ..schemas import (
    CompanyContactCreate,
    CompanyContactUpdate,
    CompanyContactResponse,
    CompanyContactListResponse
)

router = APIRouter(prefix="/api/company-contacts", tags=["company-contacts"])


@router.get("/company/{company_id}", response_model=CompanyContactListResponse)
def get_company_contacts(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all contacts for a specific company with their roles"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Query with relationship to get contact details
    company_contacts = db.query(CompanyContact).options(
        joinedload(CompanyContact.contact)
    ).filter(
        CompanyContact.company_id == company_id
    ).all()
    
    # Return empty list if no contacts found instead of 404
    return CompanyContactListResponse(
        company_id=company_id,
        company_name=company.name,
        contacts=company_contacts
    )


@router.post("/", response_model=CompanyContactResponse)
def create_company_contact(
    contact_data: CompanyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a contact to a company with a specific role"""
    # Vérifier que l'entreprise existe
    company = db.query(Company).filter(Company.id == contact_data.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Vérifier que le contact existe
    contact = db.query(Contact).filter(Contact.id == contact_data.contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Vérifier que le contact n'est pas déjà lié à cette entreprise
    existing_company_contact = db.query(CompanyContact).filter(
        CompanyContact.company_id == contact_data.company_id,
        CompanyContact.contact_id == contact_data.contact_id
    ).first()
    
    if existing_company_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact is already linked to this company"
        )
    
    # Si c'est le contact principal, s'assurer qu'il n'y en a qu'un seul
    if contact_data.is_primary:
        db.query(CompanyContact).filter(
            CompanyContact.company_id == contact_data.company_id,
            CompanyContact.is_primary == True
        ).update({"is_primary": False})
    
    # Créer le lien entreprise-contact
    company_contact = CompanyContact(
        company_id=contact_data.company_id,
        contact_id=contact_data.contact_id,
        role=contact_data.role,
        department=contact_data.department,
        is_primary=contact_data.is_primary or False
    )
    
    db.add(company_contact)
    db.commit()
    db.refresh(company_contact)
    
    return company_contact


@router.put("/{company_contact_id}", response_model=CompanyContactResponse)
def update_company_contact(
    company_contact_id: int,
    contact_data: CompanyContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a company contact's role and information"""
    company_contact = db.query(CompanyContact).filter(
        CompanyContact.id == company_contact_id
    ).first()
    
    if not company_contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company contact not found"
        )
    
    # Si on définit ce contact comme principal, retirer le statut principal des autres
    if contact_data.is_primary:
        db.query(CompanyContact).filter(
            CompanyContact.company_id == company_contact.company_id,
            CompanyContact.id != company_contact_id,
            CompanyContact.is_primary == True
        ).update({"is_primary": False})
    
    # Mettre à jour les champs
    for field, value in contact_data.dict(exclude_unset=True).items():
        setattr(company_contact, field, value)
    
    db.commit()
    db.refresh(company_contact)
    
    return company_contact


@router.delete("/{company_contact_id}")
def delete_company_contact(
    company_contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a contact from a company"""
    company_contact = db.query(CompanyContact).filter(
        CompanyContact.id == company_contact_id
    ).first()
    
    if not company_contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company contact not found"
        )
    
    db.delete(company_contact)
    db.commit()
    
    return {"message": "Contact removed from company successfully"}


@router.get("/contact/{contact_id}", response_model=List[CompanyContactResponse])
def get_contact_companies(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all companies where a contact has a role"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    company_contacts = db.query(CompanyContact).filter(
        CompanyContact.contact_id == contact_id
    ).all()
    
    return company_contacts


@router.get("/debug/check-tables")
def debug_check_tables(db: Session = Depends(get_db)):
    """Debug endpoint to check if tables exist and have data"""
    try:
        # Check if CompanyContact table exists and has data
        company_contacts_count = db.query(CompanyContact).count()
        
        # Check if Company table exists and has data
        companies_count = db.query(Company).count()
        
        # Get a sample company
        sample_company = db.query(Company).first()
        
        return {
            "company_contacts_count": company_contacts_count,
            "companies_count": companies_count,
            "sample_company": {
                "id": sample_company.id if sample_company else None,
                "name": sample_company.name if sample_company else None
            } if sample_company else None,
            "company_contacts_for_sample": db.query(CompanyContact).filter(
                CompanyContact.company_id == sample_company.id
            ).count() if sample_company else 0
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/test")
def test_endpoint():
    """Simple test endpoint to verify router is working"""
    return {"message": "Company contacts router is working!", "status": "ok"}