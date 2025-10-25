from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from ..models import CompetitiveAnalysis
from ..schemas import (
    CompetitiveAnalysisCreate,
    CompetitiveAnalysisUpdate,
    CompetitiveAnalysisResponse,
    AnalysisResponseSchema
)


class CompetitiveAnalysisService:
    
    @staticmethod
    def create_analysis(db: Session, analysis_data: CompetitiveAnalysisCreate, user_id: int) -> CompetitiveAnalysis:
        """Create a new competitive analysis"""
        
        # Convert responses to dict format for JSON storage
        responses_dict = [
            {
                "questionId": r.questionId,
                "answer": r.answer,
                "timestamp": r.timestamp.isoformat() if isinstance(r.timestamp, datetime) else r.timestamp
            }
            for r in analysis_data.responses
        ]
        
        # Convert metadata to dict
        metadata_dict = analysis_data.metadata.model_dump() if analysis_data.metadata else None
        
        db_analysis = CompetitiveAnalysis(
            user_id=user_id,
            title=analysis_data.title,
            status=analysis_data.status,
            current_step=analysis_data.current_step,
            responses=responses_dict,
            analysis_metadata=metadata_dict
        )
        
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        return db_analysis
    
    @staticmethod
    def get_analyses(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[CompetitiveAnalysis]:
        """Get all analyses for a user"""
        return db.query(CompetitiveAnalysis).filter(
            CompetitiveAnalysis.user_id == user_id
        ).order_by(
            CompetitiveAnalysis.updated_at.desc()
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_analysis_by_id(db: Session, analysis_id: int, user_id: int) -> Optional[CompetitiveAnalysis]:
        """Get a specific analysis by ID"""
        return db.query(CompetitiveAnalysis).filter(
            CompetitiveAnalysis.id == analysis_id,
            CompetitiveAnalysis.user_id == user_id
        ).first()
    
    @staticmethod
    def update_analysis(
        db: Session,
        analysis_id: int,
        user_id: int,
        analysis_update: CompetitiveAnalysisUpdate
    ) -> Optional[CompetitiveAnalysis]:
        """Update an existing analysis"""
        
        db_analysis = CompetitiveAnalysisService.get_analysis_by_id(db, analysis_id, user_id)
        if not db_analysis:
            return None
        
        update_data = analysis_update.model_dump(exclude_unset=True)
        
        # Convert responses if present
        if "responses" in update_data and update_data["responses"]:
            responses_dict = [
                {
                    "questionId": r.questionId,
                    "answer": r.answer,
                    "timestamp": r.timestamp.isoformat() if isinstance(r.timestamp, datetime) else r.timestamp
                }
                for r in update_data["responses"]
            ]
            update_data["responses"] = responses_dict
        
        # Convert metadata if present
        if "metadata" in update_data and update_data["metadata"]:
            update_data["metadata"] = update_data["metadata"].model_dump() if hasattr(update_data["metadata"], "model_dump") else update_data["metadata"]
        
        for key, value in update_data.items():
            setattr(db_analysis, key, value)
        
        db_analysis.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_analysis)
        
        return db_analysis
    
    @staticmethod
    def delete_analysis(db: Session, analysis_id: int, user_id: int) -> bool:
        """Delete an analysis"""
        
        db_analysis = CompetitiveAnalysisService.get_analysis_by_id(db, analysis_id, user_id)
        if not db_analysis:
            return False
        
        db.delete(db_analysis)
        db.commit()
        
        return True
    
    @staticmethod
    def export_analysis(db: Session, analysis_id: int, user_id: int) -> Optional[dict]:
        """Export analysis data for download"""
        
        db_analysis = CompetitiveAnalysisService.get_analysis_by_id(db, analysis_id, user_id)
        if not db_analysis:
            return None
        
        return {
            "id": db_analysis.id,
            "title": db_analysis.title,
            "status": db_analysis.status,
            "current_step": db_analysis.current_step,
            "responses": db_analysis.responses,
            "metadata": db_analysis.analysis_metadata,
            "created_at": db_analysis.created_at.isoformat(),
            "updated_at": db_analysis.updated_at.isoformat()
        }

