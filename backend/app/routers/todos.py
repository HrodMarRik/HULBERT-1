from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ..db import get_db
from ..security import get_current_user
from ..models import Todo, User, Project, Ticket
from ..schemas import (
    TodoCreate, TodoUpdate, TodoResponse
)

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=List[TodoResponse])
def list_todos(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project_id: Optional[int] = None,
    ticket_id: Optional[int] = None,
    overdue: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les todos avec filtres optionnels"""
    query = db.query(Todo).filter(Todo.created_by_user_id == current_user.id)
    
    if status:
        query = query.filter(Todo.status == status)
    if priority:
        query = query.filter(Todo.priority == priority)
    if project_id:
        query = query.filter(Todo.project_id == project_id)
    if ticket_id:
        query = query.filter(Todo.ticket_id == ticket_id)
    if overdue:
        now = datetime.utcnow()
        query = query.filter(
            Todo.due_date < now,
            Todo.status != "completed"
        )
    
    todos = query.order_by(Todo.created_at.desc()).offset(skip).limit(limit).all()
    return todos


@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo_data: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau todo"""
    todo = Todo(
        **todo_data.dict(),
        created_by_user_id=current_user.id
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un todo par son ID"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.created_by_user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.created_by_user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Mettre à jour les champs fournis
    update_dict = todo_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(todo, field, value)
    
    # Si le statut passe à "completed", enregistrer la date de completion
    if update_dict.get("status") == "completed" and todo.status != "completed":
        todo.completed_at = datetime.utcnow()
    
    todo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.created_by_user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(todo)
    db.commit()
    
    return {"message": "Todo supprimé avec succès"}


@router.get("/stats/summary")
def get_todo_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les statistiques globales des todos"""
    user_todos = db.query(Todo).filter(Todo.created_by_user_id == current_user.id)
    
    total = user_todos.count()
    pending = user_todos.filter(Todo.status == "pending").count()
    in_progress = user_todos.filter(Todo.status == "in_progress").count()
    completed = user_todos.filter(Todo.status == "completed").count()
    
    # Todos en retard
    now = datetime.utcnow()
    overdue = user_todos.filter(
        Todo.due_date < now,
        Todo.status != "completed"
    ).count()
    
    # Par priorité
    priority_stats = db.query(
        Todo.priority,
        func.count(Todo.id)
    ).filter(Todo.created_by_user_id == current_user.id).group_by(Todo.priority).all()
    by_priority = {priority: count for priority, count in priority_stats}
    
    # Todos récents (créés dans les 7 derniers jours)
    week_ago = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=7)
    recent = user_todos.filter(Todo.created_at >= week_ago).count()
    
    return {
        "total": total,
        "by_status": {
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed
        },
        "by_priority": by_priority,
        "overdue": overdue,
        "recent": recent
    }


@router.post("/{todo_id}/complete")
def complete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marque un todo comme terminé"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.created_by_user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    todo.status = "completed"
    todo.completed_at = datetime.utcnow()
    todo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(todo)
    
    return {"message": "Todo marqué comme terminé", "todo": todo}
