from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List

from ..db import get_db
from ..security import get_current_user
from ..models import User
from ..schemas import (
    CompetitiveAnalysisCreate,
    CompetitiveAnalysisUpdate,
    CompetitiveAnalysisResponse,
    CompetitiveAnalysisListResponse
)
from ..services.competitive_analysis_service import CompetitiveAnalysisService

router = APIRouter(prefix="/competitive-analysis", tags=["Competitive Analysis"])


@router.post("", response_model=CompetitiveAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_analysis(
    analysis: CompetitiveAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new competitive analysis"""
    try:
        db_analysis = CompetitiveAnalysisService.create_analysis(db, analysis, current_user.id)
        
        # Convert responses back to proper format
        response_data = {
            "id": db_analysis.id,
            "user_id": db_analysis.user_id,
            "title": db_analysis.title,
            "status": db_analysis.status,
            "current_step": db_analysis.current_step,
            "responses": db_analysis.responses or [],
            "metadata": db_analysis.analysis_metadata,
            "created_at": db_analysis.created_at,
            "updated_at": db_analysis.updated_at
        }
        
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating analysis: {str(e)}"
        )


@router.get("", response_model=List[CompetitiveAnalysisListResponse])
def get_analyses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all competitive analyses for the current user"""
    try:
        analyses = CompetitiveAnalysisService.get_analyses(db, current_user.id, skip, limit)
        
        return [
            {
                "id": a.id,
                "title": a.title,
                "status": a.status,
                "current_step": a.current_step,
                "metadata": a.analysis_metadata,
                "created_at": a.created_at,
                "updated_at": a.updated_at
            }
            for a in analyses
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching analyses: {str(e)}"
        )


@router.get("/{analysis_id}", response_model=CompetitiveAnalysisResponse)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific competitive analysis"""
    db_analysis = CompetitiveAnalysisService.get_analysis_by_id(db, analysis_id, current_user.id)
    
    if not db_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return {
        "id": db_analysis.id,
        "user_id": db_analysis.user_id,
        "title": db_analysis.title,
        "status": db_analysis.status,
        "current_step": db_analysis.current_step,
        "responses": db_analysis.responses or [],
        "metadata": db_analysis.analysis_metadata,
        "created_at": db_analysis.created_at,
        "updated_at": db_analysis.updated_at
    }


@router.put("/{analysis_id}", response_model=CompetitiveAnalysisResponse)
def update_analysis(
    analysis_id: int,
    analysis_update: CompetitiveAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a competitive analysis"""
    try:
        db_analysis = CompetitiveAnalysisService.update_analysis(
            db, analysis_id, current_user.id, analysis_update
        )
        
        if not db_analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        return {
            "id": db_analysis.id,
            "user_id": db_analysis.user_id,
            "title": db_analysis.title,
            "status": db_analysis.status,
            "current_step": db_analysis.current_step,
            "responses": db_analysis.responses or [],
            "metadata": db_analysis.analysis_metadata,
            "created_at": db_analysis.created_at,
            "updated_at": db_analysis.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating analysis: {str(e)}"
        )


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a competitive analysis"""
    success = CompetitiveAnalysisService.delete_analysis(db, analysis_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return None


@router.get("/{analysis_id}/export")
def export_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export analysis data as JSON"""
    export_data = CompetitiveAnalysisService.export_analysis(db, analysis_id, current_user.id)
    
    if not export_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return JSONResponse(content=export_data)

