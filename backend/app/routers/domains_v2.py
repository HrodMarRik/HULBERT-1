from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import get_current_user
from ..services.file_service import FileService
from ..models import FileMetadata

router = APIRouter(prefix="/api/domains-v2", tags=["domains-v2"])


@router.get("/tree")
def list_tree(path: Optional[str] = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Liste les fichiers et dossiers d'un répertoire"""
    file_service = FileService(db)
    items = file_service.get_directory_tree(path or "")
    return {"path": path or ".", "items": items}


@router.get("/file")
def read_file(path: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Lit le contenu d'un fichier"""
    file_service = FileService(db)
    content = file_service.get_file_content(path)
    
    if content is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"content": content}


@router.post("/file")
def write_file(
    path: str = Body(...),
    content: str = Body(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Écrit le contenu dans un fichier"""
    file_service = FileService(db)
    success = file_service.save_file_content(path, content)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save file")
    
    return {"message": "File saved successfully"}


@router.post("/folder")
def create_folder(
    path: str = Body(...),
    isDir: bool = Body(True),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau dossier"""
    file_service = FileService(db)
    
    if isDir:
        # Créer le dossier
        full_path = file_service.domains_root / path
        full_path.mkdir(parents=True, exist_ok=True)
        
        # Synchroniser avec la BDD
        file_service._sync_file_metadata(path, True)
        db.commit()
        
        return {"message": "Folder created successfully"}
    else:
        # Créer un fichier vide
        full_path = file_service.domains_root / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.touch()
        
        # Synchroniser avec la BDD
        file_service._sync_file_metadata(path, False)
        db.commit()
        
        return {"message": "File created successfully"}


@router.delete("/delete")
def delete_path(
    path: str = Body(...),
    archive: bool = Body(False),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un fichier ou dossier"""
    file_service = FileService(db)
    full_path = file_service.domains_root / path
    
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    
    if archive:
        # TODO: Implémenter l'archivage
        pass
    
    # Supprimer le fichier/dossier
    if full_path.is_dir():
        import shutil
        shutil.rmtree(full_path)
    else:
        full_path.unlink()
    
    # Supprimer de la BDD
    db.query(FileMetadata).filter(FileMetadata.path == path).delete()
    db.commit()
    
    return {"message": "Path deleted successfully"}


@router.get("/search")
def search_files(
    q: str,
    limit: int = 5,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recherche rapide dans les fichiers"""
    file_service = FileService(db)
    results = file_service.search_files(q, limit)
    
    # Convertir en format attendu par le frontend
    formatted_results = []
    for result in results:
        formatted_results.append({
            "name": result.name,
            "isDir": result.is_directory,
            "path": result.path,
            "size": result.size,
            "file_type": result.file_type,
            "mime_type": result.mime_type,
            "modified_at": result.modified_at.isoformat() if result.modified_at else None
        })
    
    return {"results": formatted_results, "total": len(formatted_results)}


@router.post("/sync")
def sync_files(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Synchronise tous les fichiers avec la base de données"""
    file_service = FileService(db)
    count = file_service.scan_and_sync_files()
    return {"message": f"Synchronized {count} files and directories"}
