import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime

from ..db import get_db
from ..security import get_current_user
from ..models import User, Document, Project, Company, Contact

router = APIRouter(prefix="/api/files", tags=["files"])

# Configuration
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
    'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def get_file_extension(filename: str) -> str:
    """Extrait l'extension du fichier"""
    return filename.split('.')[-1].lower() if '.' in filename else ''

def is_allowed_file(filename: str) -> bool:
    """Vérifie si le fichier est autorisé"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS

def get_file_type(filename: str) -> str:
    """Détermine le type de fichier basé sur l'extension"""
    ext = get_file_extension(filename)
    if ext in ['pdf']:
        return 'pdf'
    elif ext in ['doc', 'docx']:
        return 'document'
    elif ext in ['xls', 'xlsx']:
        return 'spreadsheet'
    elif ext in ['ppt', 'pptx']:
        return 'presentation'
    elif ext in ['jpg', 'jpeg', 'png', 'gif']:
        return 'image'
    elif ext in ['zip', 'rar']:
        return 'archive'
    else:
        return 'other'

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),
    company_id: Optional[int] = Form(None),
    contact_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload un fichier et l'associe à un projet, company ou contact"""
    
    # Vérifier que le fichier est fourni
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Vérifier l'extension
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Vérifier la taille
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")
    
    # Vérifier qu'au moins une entité est spécifiée
    if not any([project_id, company_id, contact_id]):
        raise HTTPException(status_code=400, detail="Must specify project_id, company_id, or contact_id")
    
    # Vérifier que les entités existent
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        company_id = project.company_id  # Utiliser la company du projet
    
    if company_id:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
    
    if contact_id:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        if not company_id:
            company_id = contact.company_id
    
    # Créer le répertoire de destination
    if project_id:
        upload_path = os.path.join(UPLOAD_DIR, "projects", str(project_id))
    elif company_id:
        upload_path = os.path.join(UPLOAD_DIR, "companies", str(company_id))
    else:
        upload_path = os.path.join(UPLOAD_DIR, "contacts", str(contact_id))
    
    os.makedirs(upload_path, exist_ok=True)
    
    # Générer un nom de fichier unique
    file_extension = get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(upload_path, unique_filename)
    
    # Sauvegarder le fichier
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Créer l'entrée en base de données
    document = Document(
        company_id=company_id,
        contact_id=contact_id,
        project_id=project_id,
        filename=file.filename,
        file_path=file_path,
        file_type=get_file_type(file.filename),
        file_size=len(file_content),
        description=description,
        uploaded_by_user_id=current_user.id,
        uploaded_at=datetime.utcnow()
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return {
        "id": document.id,
        "filename": document.filename,
        "file_path": document.file_path,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "description": document.description,
        "uploaded_at": document.uploaded_at,
        "uploaded_by": current_user.username,
        "project_id": project_id,
        "company_id": company_id,
        "contact_id": contact_id
    }

@router.get("/download/{document_id}")
async def download_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Télécharge un fichier par son ID"""
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=document.file_path,
        filename=document.filename,
        media_type='application/octet-stream'
    )

@router.delete("/{document_id}")
async def delete_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un fichier"""
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Supprimer le fichier du disque
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            print(f"Warning: Could not delete file {document.file_path}: {e}")
    
    # Supprimer l'entrée de la base de données
    db.delete(document)
    db.commit()
    
    return {"message": "File deleted successfully"}
