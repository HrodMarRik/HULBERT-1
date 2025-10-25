from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
import logging

from ..db import get_db
from ..models import User, Invoice, InvoiceLine, Quote, QuoteLine, TaxRate, Company, Contact
from ..schemas import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceLineCreate, InvoiceLineResponse,
    QuoteCreate, QuoteUpdate, QuoteResponse, QuoteLineCreate, QuoteLineResponse,
    TaxRateCreate, TaxRateUpdate, TaxRateResponse, QuoteConvert, InvoicePDF,
    InvoiceCreateUpdated, InvoiceUpdateUpdated, InvoiceResponseUpdated, PaymentReminderCreate, PaymentReminderResponse
)
from ..security import get_current_user
from ..services.invoicing_service import InvoicingService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/invoicing", tags=["invoicing"])

# Initialize service
invoicing_service = InvoicingService()


# =============================================================================
# TAX RATE ENDPOINTS
# =============================================================================

@router.get("/tax-rates", response_model=List[TaxRateResponse])
async def get_tax_rates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tax rates with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting tax rates")
        
        query = db.query(TaxRate)
        
        if is_active is not None:
            query = query.filter(TaxRate.is_active == is_active)
        
        tax_rates = query.order_by(TaxRate.rate_percentage).offset(skip).limit(limit).all()
        
        logger.info(f"Found {len(tax_rates)} tax rates")
        return tax_rates
    except Exception as e:
        logger.error(f"Error getting tax rates: {e}")
        raise HTTPException(status_code=500, detail="Error fetching tax rates")


@router.post("/tax-rates", response_model=TaxRateResponse)
async def create_tax_rate(
    tax_rate: TaxRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tax rate"""
    try:
        logger.info(f"User {current_user.id} creating tax rate {tax_rate.code}")
        
        # Check if tax rate code already exists
        existing_rate = db.query(TaxRate).filter(TaxRate.code == tax_rate.code).first()
        if existing_rate:
            raise HTTPException(status_code=400, detail="Tax rate code already exists")
        
        db_tax_rate = TaxRate(**tax_rate.dict())
        db.add(db_tax_rate)
        db.commit()
        db.refresh(db_tax_rate)
        
        logger.info(f"Tax rate {tax_rate.code} created successfully")
        return db_tax_rate
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tax rate: {e}")
        raise HTTPException(status_code=500, detail="Error creating tax rate")


# =============================================================================
# INVOICE ENDPOINTS
# =============================================================================

@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    client_company_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoices with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting invoices")
        
        query = db.query(Invoice)
        
        if status:
            query = query.filter(Invoice.status == status)
        if client_company_id:
            query = query.filter(Invoice.client_company_id == client_company_id)
        if start_date:
            query = query.filter(Invoice.issue_date >= start_date)
        if end_date:
            query = query.filter(Invoice.issue_date <= end_date)
        
        invoices = query.order_by(Invoice.issue_date.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"Found {len(invoices)} invoices")
        return invoices
    except Exception as e:
        logger.error(f"Error getting invoices: {e}")
        raise HTTPException(status_code=500, detail="Error fetching invoices")


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific invoice by ID"""
    try:
        logger.info(f"User {current_user.id} requesting invoice {invoice_id}")
        
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoice: {e}")
        raise HTTPException(status_code=500, detail="Error fetching invoice")


@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice"""
    try:
        logger.info(f"User {current_user.id} creating invoice")
        
        # Generate invoice number
        invoice_count = db.query(Invoice).count()
        invoice_number = f"INV{datetime.now().year:04d}{invoice_count + 1:06d}"
        
        # Calculate totals
        subtotal = sum(line.line_total for line in invoice.invoice_lines)
        total_tax = sum(line.line_total * line.tax_rate_percentage / 100 for line in invoice.invoice_lines)
        total_amount = subtotal + total_tax
        
        # Create invoice
        db_invoice = Invoice(
            invoice_number=invoice_number,
            document_type=invoice.document_type,
            client_company_id=invoice.client_company_id,
            client_contact_id=invoice.client_contact_id,
            client_name=invoice.client_name,
            client_address=invoice.client_address,
            client_email=invoice.client_email,
            issue_date=invoice.issue_date,
            due_date=invoice.due_date,
            subtotal=subtotal,
            total_tax=total_tax,
            total_amount=total_amount,
            currency=invoice.currency,
            notes=invoice.notes,
            payment_terms=invoice.payment_terms,
            reference_number=invoice.reference_number,
            created_by_user_id=current_user.id
        )
        db.add(db_invoice)
        db.flush()  # Get the ID
        
        # Create invoice lines
        for line_data in invoice.invoice_lines:
            db_line = InvoiceLine(
                invoice_id=db_invoice.id,
                description=line_data.description,
                quantity=line_data.quantity,
                unit_price=line_data.unit_price,
                tax_rate_id=line_data.tax_rate_id,
                tax_rate_percentage=line_data.tax_rate_percentage,
                line_total=line_data.line_total,
                line_order=line_data.line_order
            )
            db.add(db_line)
        
        db.commit()
        db.refresh(db_invoice)
        
        logger.info(f"Invoice {invoice_number} created successfully with amount {total_amount}")
        return db_invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating invoice: {e}")
        raise HTTPException(status_code=500, detail="Error creating invoice")


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    invoice: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an invoice"""
    try:
        logger.info(f"User {current_user.id} updating invoice {invoice_id}")
        
        db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not db_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Only allow updates if invoice is in draft status
        if db_invoice.status != "draft":
            raise HTTPException(status_code=400, detail="Cannot update sent or paid invoices")
        
        for field, value in invoice.dict(exclude_unset=True).items():
            setattr(db_invoice, field, value)
        
        db.commit()
        db.refresh(db_invoice)
        
        logger.info(f"Invoice {invoice_id} updated successfully")
        return db_invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating invoice: {e}")
        raise HTTPException(status_code=500, detail="Error updating invoice")


@router.post("/invoices/{invoice_id}/generate-pdf")
async def generate_invoice_pdf(
    invoice_id: int,
    pdf_options: InvoicePDF,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate PDF for an invoice"""
    try:
        logger.info(f"User {current_user.id} generating PDF for invoice {invoice_id}")
        
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # TODO: Implement PDF generation with ReportLab
        # For now, return a placeholder response
        logger.info(f"PDF generation requested for invoice {invoice_id}")
        
        return {
            "message": "PDF generation initiated",
            "invoice_id": invoice_id,
            "pdf_url": f"/api/invoicing/invoices/{invoice_id}/pdf"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invoice PDF: {e}")
        raise HTTPException(status_code=500, detail="Error generating invoice PDF")


@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download invoice PDF"""
    try:
        logger.info(f"User {current_user.id} downloading PDF for invoice {invoice_id}")
        
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # TODO: Implement PDF file serving
        # For now, return a placeholder response
        return {"message": "PDF download not yet implemented"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading invoice PDF: {e}")
        raise HTTPException(status_code=500, detail="Error downloading invoice PDF")


@router.post("/invoices/{invoice_id}/send-email")
async def send_invoice_email(
    invoice_id: int,
    email_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send invoice by email"""
    try:
        logger.info(f"User {current_user.id} sending invoice {invoice_id} to {email_address}")
        
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # TODO: Implement email sending
        # For now, return a placeholder response
        logger.info(f"Email sending requested for invoice {invoice_id} to {email_address}")
        
        return {
            "message": "Invoice email sent successfully",
            "invoice_id": invoice_id,
            "email_address": email_address
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invoice email: {e}")
        raise HTTPException(status_code=500, detail="Error sending invoice email")


# =============================================================================
# QUOTE ENDPOINTS
# =============================================================================

@router.get("/quotes", response_model=List[QuoteResponse])
async def get_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    client_company_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quotes with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting quotes")
        
        query = db.query(Quote)
        
        if status:
            query = query.filter(Quote.status == status)
        if client_company_id:
            query = query.filter(Quote.client_company_id == client_company_id)
        if start_date:
            query = query.filter(Quote.issue_date >= start_date)
        if end_date:
            query = query.filter(Quote.issue_date <= end_date)
        
        quotes = query.order_by(Quote.issue_date.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"Found {len(quotes)} quotes")
        return quotes
    except Exception as e:
        logger.error(f"Error getting quotes: {e}")
        raise HTTPException(status_code=500, detail="Error fetching quotes")


@router.get("/quotes/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific quote by ID"""
    try:
        logger.info(f"User {current_user.id} requesting quote {quote_id}")
        
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        return quote
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quote: {e}")
        raise HTTPException(status_code=500, detail="Error fetching quote")


@router.post("/quotes", response_model=QuoteResponse)
async def create_quote(
    quote: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new quote"""
    try:
        logger.info(f"User {current_user.id} creating quote")
        
        # Generate quote number
        quote_count = db.query(Quote).count()
        quote_number = f"QUO{datetime.now().year:04d}{quote_count + 1:06d}"
        
        # Calculate totals
        subtotal = sum(line.line_total for line in quote.quote_lines)
        total_tax = sum(line.line_total * line.tax_rate_percentage / 100 for line in quote.quote_lines)
        total_amount = subtotal + total_tax
        
        # Create quote
        db_quote = Quote(
            quote_number=quote_number,
            client_company_id=quote.client_company_id,
            client_contact_id=quote.client_contact_id,
            client_name=quote.client_name,
            client_address=quote.client_address,
            client_email=quote.client_email,
            issue_date=quote.issue_date,
            valid_until=quote.valid_until,
            subtotal=subtotal,
            total_tax=total_tax,
            total_amount=total_amount,
            currency=quote.currency,
            notes=quote.notes,
            terms_conditions=quote.terms_conditions,
            created_by_user_id=current_user.id
        )
        db.add(db_quote)
        db.flush()  # Get the ID
        
        # Create quote lines
        for line_data in quote.quote_lines:
            db_line = QuoteLine(
                quote_id=db_quote.id,
                description=line_data.description,
                quantity=line_data.quantity,
                unit_price=line_data.unit_price,
                tax_rate_id=line_data.tax_rate_id,
                tax_rate_percentage=line_data.tax_rate_percentage,
                line_total=line_data.line_total,
                line_order=line_data.line_order
            )
            db.add(db_line)
        
        db.commit()
        db.refresh(db_quote)
        
        logger.info(f"Quote {quote_number} created successfully with amount {total_amount}")
        return db_quote
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quote: {e}")
        raise HTTPException(status_code=500, detail="Error creating quote")


@router.put("/quotes/{quote_id}", response_model=QuoteResponse)
async def update_quote(
    quote_id: int,
    quote: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a quote"""
    try:
        logger.info(f"User {current_user.id} updating quote {quote_id}")
        
        db_quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not db_quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Only allow updates if quote is in draft status
        if db_quote.status != "draft":
            raise HTTPException(status_code=400, detail="Cannot update sent or accepted quotes")
        
        for field, value in quote.dict(exclude_unset=True).items():
            setattr(db_quote, field, value)
        
        db.commit()
        db.refresh(db_quote)
        
        logger.info(f"Quote {quote_id} updated successfully")
        return db_quote
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quote: {e}")
        raise HTTPException(status_code=500, detail="Error updating quote")


@router.post("/quotes/{quote_id}/convert", response_model=InvoiceResponse)
async def convert_quote_to_invoice(
    quote_id: int,
    convert_data: QuoteConvert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Convert a quote to an invoice"""
    try:
        logger.info(f"User {current_user.id} converting quote {quote_id} to invoice")
        
        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        if quote.status != "accepted":
            raise HTTPException(status_code=400, detail="Only accepted quotes can be converted to invoices")
        
        # Generate invoice number
        invoice_count = db.query(Invoice).count()
        invoice_number = f"INV{datetime.now().year:04d}{invoice_count + 1:06d}"
        
        # Create invoice from quote
        db_invoice = Invoice(
            invoice_number=invoice_number,
            document_type="invoice",
            client_company_id=quote.client_company_id,
            client_contact_id=quote.client_contact_id,
            client_name=quote.client_name,
            client_address=quote.client_address,
            client_email=quote.client_email,
            issue_date=convert_data.invoice_date or datetime.now(),
            due_date=convert_data.due_date,
            subtotal=quote.subtotal,
            total_tax=quote.total_tax,
            total_amount=quote.total_amount,
            currency=quote.currency,
            notes=quote.notes,
            payment_terms="Net 30 days",
            reference_number=f"From Quote {quote.quote_number}",
            created_by_user_id=current_user.id
        )
        db.add(db_invoice)
        db.flush()  # Get the ID
        
        # Create invoice lines from quote lines
        for quote_line in quote.quote_lines:
            db_line = InvoiceLine(
                invoice_id=db_invoice.id,
                description=quote_line.description,
                quantity=quote_line.quantity,
                unit_price=quote_line.unit_price,
                tax_rate_id=quote_line.tax_rate_id,
                tax_rate_percentage=quote_line.tax_rate_percentage,
                line_total=quote_line.line_total,
                line_order=quote_line.line_order
            )
            db.add(db_line)
        
        # Update quote status
        quote.status = "converted"
        
        db.commit()
        db.refresh(db_invoice)
        
        logger.info(f"Quote {quote_id} converted to invoice {invoice_number} successfully")
        return db_invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting quote to invoice: {e}")
        raise HTTPException(status_code=500, detail="Error converting quote to invoice")


# =============================================================================
# STATISTICS ENDPOINTS
# =============================================================================

@router.get("/stats")
async def get_invoicing_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoicing statistics"""
    try:
        logger.info(f"User {current_user.id} requesting invoicing stats")
        
        # Base query
        invoice_query = db.query(Invoice)
        quote_query = db.query(Quote)
        
        if start_date:
            invoice_query = invoice_query.filter(Invoice.issue_date >= start_date)
            quote_query = quote_query.filter(Quote.issue_date >= start_date)
        if end_date:
            invoice_query = invoice_query.filter(Invoice.issue_date <= end_date)
            quote_query = quote_query.filter(Quote.issue_date <= end_date)
        
        # Invoice statistics
        total_invoices = invoice_query.count()
        paid_invoices = invoice_query.filter(Invoice.status == "paid").count()
        overdue_invoices = invoice_query.filter(Invoice.status == "overdue").count()
        total_invoice_amount = db.query(db.func.sum(Invoice.total_amount)).filter(
            Invoice.id.in_([inv.id for inv in invoice_query.all()])
        ).scalar() or 0.0
        
        # Quote statistics
        total_quotes = quote_query.count()
        accepted_quotes = quote_query.filter(Quote.status == "accepted").count()
        total_quote_amount = db.query(db.func.sum(Quote.total_amount)).filter(
            Quote.id.in_([quo.id for quo in quote_query.all()])
        ).scalar() or 0.0
        
        stats = {
            "invoices": {
                "total_count": total_invoices,
                "paid_count": paid_invoices,
                "overdue_count": overdue_invoices,
                "total_amount": float(total_invoice_amount),
                "paid_percentage": (paid_invoices / total_invoices * 100) if total_invoices > 0 else 0
            },
            "quotes": {
                "total_count": total_quotes,
                "accepted_count": accepted_quotes,
                "total_amount": float(total_quote_amount),
                "conversion_rate": (accepted_quotes / total_quotes * 100) if total_quotes > 0 else 0
            }
        }
        
        logger.info(f"Generated invoicing stats: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error generating invoicing stats: {e}")
        raise HTTPException(status_code=500, detail="Error generating invoicing statistics")


# =============================================================================
# ENHANCED INVOICING ENDPOINTS
# =============================================================================

@router.post("/invoices", response_model=InvoiceResponseUpdated)
async def create_invoice_enhanced(
    invoice_data: InvoiceCreateUpdated,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice with enhanced features"""
    try:
        logger.info(f"User {current_user.id} creating enhanced invoice for {invoice_data.client_name}")
        
        invoice = invoicing_service.create_invoice(db, invoice_data, current_user.id)
        
        logger.info(f"Enhanced invoice created: {invoice.invoice_number}")
        return invoice
    except Exception as e:
        logger.error(f"Error creating enhanced invoice: {e}")
        raise HTTPException(status_code=500, detail="Error creating invoice")

@router.put("/invoices/{invoice_id}", response_model=InvoiceResponseUpdated)
async def update_invoice_enhanced(
    invoice_id: int,
    invoice_data: InvoiceUpdateUpdated,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an invoice with enhanced features"""
    try:
        logger.info(f"User {current_user.id} updating enhanced invoice {invoice_id}")
        
        invoice = invoicing_service.update_invoice(db, invoice_id, invoice_data, current_user.id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        logger.info(f"Enhanced invoice updated: {invoice.invoice_number}")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating enhanced invoice: {e}")
        raise HTTPException(status_code=500, detail="Error updating invoice")

@router.post("/invoices/generate-from-projects")
async def generate_invoices_from_projects(
    project_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate invoices automatically from completed projects"""
    try:
        logger.info(f"User {current_user.id} generating invoices from projects: {project_ids}")
        
        invoices = invoicing_service.generate_invoices_from_projects(db, project_ids, current_user.id)
        
        logger.info(f"Generated {len(invoices)} invoices from projects")
        return {"message": f"Generated {len(invoices)} invoices", "invoices": invoices}
    except Exception as e:
        logger.error(f"Error generating invoices from projects: {e}")
        raise HTTPException(status_code=500, detail="Error generating invoices from projects")

@router.post("/invoices/{invoice_id}/mark-paid")
async def mark_invoice_as_paid(
    invoice_id: int,
    payment_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an invoice as paid"""
    try:
        logger.info(f"User {current_user.id} marking invoice {invoice_id} as paid")
        
        invoice = invoicing_service.mark_invoice_as_paid(db, invoice_id, payment_date)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        logger.info(f"Invoice marked as paid: {invoice.invoice_number}")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking invoice as paid: {e}")
        raise HTTPException(status_code=500, detail="Error marking invoice as paid")

@router.post("/invoices/{invoice_id}/send-reminder", response_model=PaymentReminderResponse)
async def send_payment_reminder(
    invoice_id: int,
    reminder_type: str = "gentle",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a payment reminder for an invoice"""
    try:
        logger.info(f"User {current_user.id} sending payment reminder for invoice {invoice_id}")
        
        reminder = invoicing_service.send_payment_reminder(db, invoice_id, reminder_type, current_user.id)
        if not reminder:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        logger.info(f"Payment reminder sent for invoice: {invoice_id}")
        return reminder
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending payment reminder: {e}")
        raise HTTPException(status_code=500, detail="Error sending payment reminder")

@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download invoice PDF"""
    try:
        logger.info(f"User {current_user.id} downloading PDF for invoice {invoice_id}")
        
        pdf_content = invoicing_service.generate_invoice_pdf(db, invoice_id)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}.pdf"}
        )
    except Exception as e:
        logger.error(f"Error generating invoice PDF: {e}")
        raise HTTPException(status_code=500, detail="Error generating invoice PDF")

@router.get("/statistics")
async def get_invoicing_statistics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get basic invoicing statistics"""
    try:
        logger.info(f"User {current_user.id} requesting invoicing statistics")
        
        # Get basic statistics
        total_invoices = db.query(Invoice).count()
        paid_invoices = db.query(Invoice).filter(Invoice.status == 'paid').count()
        pending_invoices = db.query(Invoice).filter(Invoice.status == 'sent').count()
        overdue_invoices = db.query(Invoice).filter(Invoice.status == 'overdue').count()
        
        # Calculate totals
        total_revenue = db.query(Invoice).filter(Invoice.status == 'paid').with_entities(
            func.sum(Invoice.total_amount)
        ).scalar() or 0
        
        pending_amount = db.query(Invoice).filter(Invoice.status.in_(['sent', 'overdue'])).with_entities(
            func.sum(Invoice.total_amount)
        ).scalar() or 0
        
        # Recent payments (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_payments = db.query(Invoice).filter(
            Invoice.status == 'paid',
            Invoice.payment_date >= week_ago
        ).count()
        
        stats = {
            "total_invoices": total_invoices,
            "paid_invoices": paid_invoices,
            "pending_invoices": pending_invoices,
            "overdue_invoices": overdue_invoices,
            "total_revenue": float(total_revenue),
            "pending_amount": float(pending_amount),
            "recent_payments": recent_payments
        }
        
        logger.info(f"Invoicing statistics generated successfully")
        return stats
    except Exception as e:
        logger.error(f"Error generating invoicing statistics: {e}")
        raise HTTPException(status_code=500, detail="Error generating invoicing statistics")

@router.get("/statistics/enhanced")
async def get_enhanced_invoicing_statistics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get enhanced invoicing statistics"""
    try:
        logger.info(f"User {current_user.id} requesting enhanced invoicing statistics")
        
        stats = invoicing_service.get_invoice_statistics(db, start_date, end_date)
        
        logger.info(f"Generated enhanced invoicing stats: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error generating enhanced invoicing stats: {e}")
        raise HTTPException(status_code=500, detail="Error generating enhanced invoicing statistics")
