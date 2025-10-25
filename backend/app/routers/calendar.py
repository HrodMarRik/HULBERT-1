from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from datetime import datetime, date, timedelta

from ..db import get_db
from ..security import get_current_user
from ..models import CalendarEvent, User
from ..schemas import (
    CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse, CalendarStats
)

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def compute_event_flags(event: CalendarEvent, response: CalendarEventResponse):
    """Compute is_past, is_today, is_upcoming flags for an event"""
    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    response.is_past = event.end_datetime < now
    response.is_today = today_start <= event.start_datetime <= today_end
    response.is_upcoming = event.start_datetime > now and not response.is_today
    
    return response


@router.get("/events", response_model=List[CalendarEventResponse])
def list_events(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all calendar events with optional filters"""
    query = db.query(CalendarEvent)
    
    if date_from:
        query = query.filter(CalendarEvent.start_datetime >= date_from)
    if date_to:
        query = query.filter(CalendarEvent.end_datetime <= date_to)
    if category:
        query = query.filter(CalendarEvent.category == category)
    if status:
        query = query.filter(CalendarEvent.status == status)
    if search:
        search_filter = or_(
            CalendarEvent.title.contains(search),
            CalendarEvent.description.contains(search),
            CalendarEvent.location.contains(search)
        )
        query = query.filter(search_filter)
    
    events = query.order_by(CalendarEvent.start_datetime.desc()).offset(skip).limit(limit).all()
    
    # Compute flags for each event
    results = []
    for event in events:
        response = CalendarEventResponse.model_validate(event)
        response = compute_event_flags(event, response)
        results.append(response)
    
    return results


@router.get("/events/upcoming", response_model=List[CalendarEventResponse])
def list_upcoming_events(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get upcoming events"""
    now = datetime.utcnow()
    events = db.query(CalendarEvent).filter(
        CalendarEvent.start_datetime > now,
        CalendarEvent.status != "cancelled"
    ).order_by(CalendarEvent.start_datetime.asc()).limit(limit).all()
    
    results = []
    for event in events:
        response = CalendarEventResponse.model_validate(event)
        response = compute_event_flags(event, response)
        results.append(response)
    
    return results


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new calendar event"""
    # Validate dates
    if event_data.end_datetime <= event_data.start_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End datetime must be after start datetime"
        )
    
    event = CalendarEvent(
        **event_data.model_dump(exclude={"recurrence_pattern"}),
        recurrence_pattern=event_data.recurrence_pattern.model_dump() if event_data.recurrence_pattern else None,
        created_by_user_id=current_user.id
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    response = CalendarEventResponse.model_validate(event)
    response = compute_event_flags(event, response)
    return response


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a calendar event by ID"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    response = CalendarEventResponse.model_validate(event)
    response = compute_event_flags(event, response)
    return response


@router.put("/events/{event_id}", response_model=CalendarEventResponse)
def update_event(
    event_id: int,
    event_data: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a calendar event"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update fields
    update_data = event_data.model_dump(exclude_unset=True, exclude={"recurrence_pattern"})
    for field, value in update_data.items():
        setattr(event, field, value)
    
    # Handle recurrence_pattern separately
    if event_data.recurrence_pattern is not None:
        event.recurrence_pattern = event_data.recurrence_pattern.model_dump()
    
    # Validate dates if both are present
    if event.end_datetime <= event.start_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End datetime must be after start datetime"
        )
    
    db.commit()
    db.refresh(event)
    
    response = CalendarEventResponse.model_validate(event)
    response = compute_event_flags(event, response)
    return response


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a calendar event"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return None


@router.get("/stats/summary", response_model=CalendarStats)
def get_calendar_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get calendar statistics"""
    now = datetime.utcnow()
    
    # Total events
    total = db.query(func.count(CalendarEvent.id)).scalar()
    
    # Upcoming events
    upcoming = db.query(func.count(CalendarEvent.id)).filter(
        CalendarEvent.start_datetime > now,
        CalendarEvent.status != "cancelled"
    ).scalar()
    
    # Past events
    past = db.query(func.count(CalendarEvent.id)).filter(
        CalendarEvent.end_datetime < now
    ).scalar()
    
    # By category
    category_stats = db.query(
        CalendarEvent.category,
        func.count(CalendarEvent.id)
    ).group_by(CalendarEvent.category).all()
    by_category = {cat: count for cat, count in category_stats}
    
    # By status
    status_stats = db.query(
        CalendarEvent.status,
        func.count(CalendarEvent.id)
    ).group_by(CalendarEvent.status).all()
    by_status = {stat: count for stat, count in status_stats}
    
    return CalendarStats(
        total=total or 0,
        upcoming=upcoming or 0,
        past=past or 0,
        by_category=by_category,
        by_status=by_status
    )

