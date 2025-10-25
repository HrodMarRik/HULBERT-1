import os
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ..models import FileMetadata
from ..config import get_settings


class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.domains_root = Path(self.settings.domains_root).resolve()

    def scan_and_sync_files(self) -> int:
        """Scanne tous les fichiers et synchronise avec la base de données"""
        print(f"Starting file scan from: {self.domains_root}")
        
        scanned_count = 0
        for root, dirs, files in os.walk(self.domains_root):
            root_path = Path(root)
            
            # Exclure les dossiers inutiles
            excluded_dirs = {'node_modules', '__pycache__', '.git', '.vscode', '.angular', 'dist', 'build', '.next', 'coverage'}
            dirs[:] = [d for d in dirs if d not in excluded_dirs]
            
            # Traiter les dossiers
            for dir_name in dirs:
                dir_path = root_path / dir_name
                relative_path = dir_path.relative_to(self.domains_root)
                self._sync_file_metadata(str(relative_path), True)
                scanned_count += 1
            
            # Traiter les fichiers
            for file_name in files:
                file_path = root_path / file_name
                relative_path = file_path.relative_to(self.domains_root)
                self._sync_file_metadata(str(relative_path), False)
                scanned_count += 1
        
        self.db.commit()
        print(f"Scanned {scanned_count} files and directories")
        return scanned_count

    def clean_excluded_dirs(self) -> int:
        """Supprime toutes les entrées des dossiers exclus de la base de données"""
        excluded_dirs = ['node_modules', '__pycache__', '.git', '.vscode', '.angular', 'dist', 'build', '.next', 'coverage']
        
        total_deleted = 0
        for excluded_dir in excluded_dirs:
            deleted_count = self.db.query(FileMetadata).filter(
                FileMetadata.path.like(f'%{excluded_dir}%')
            ).delete()
            total_deleted += deleted_count
            if deleted_count > 0:
                print(f"Removed {deleted_count} {excluded_dir} entries from database")
        
        self.db.commit()
        print(f"Total removed: {total_deleted} excluded directory entries")
        return total_deleted

    def _sync_file_metadata(self, relative_path: str, is_directory: bool):
        """Synchronise les métadonnées d'un fichier/dossier"""
        full_path = self.domains_root / relative_path
        
        if not full_path.exists():
            # Supprimer de la BDD si le fichier n'existe plus
            self.db.query(FileMetadata).filter(FileMetadata.path == relative_path).delete()
            return
        
        # Obtenir les informations du fichier
        stat = full_path.stat()
        name = full_path.name
        parent_path = str(full_path.parent.relative_to(self.domains_root)) if full_path.parent != self.domains_root else ""
        
        # Déterminer le type de fichier
        file_type = None
        mime_type = None
        content_preview = None
        
        if not is_directory:
            file_type = full_path.suffix.lower()
            mime_type, _ = mimetypes.guess_type(str(full_path))
            
            # Lire un aperçu du contenu pour les fichiers texte
            if mime_type and mime_type.startswith('text/'):
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content_preview = f.read(500)  # Premiers 500 caractères
                except:
                    content_preview = None
        
        # Créer le vecteur de recherche
        search_vector = f"{name} {relative_path}"
        if content_preview:
            search_vector += f" {content_preview[:200]}"
        
        # Vérifier si l'entrée existe déjà
        existing = self.db.query(FileMetadata).filter(FileMetadata.path == relative_path).first()
        
        if existing:
            # Mettre à jour si nécessaire
            if (existing.modified_at.timestamp() < stat.st_mtime or 
                existing.size != stat.st_size):
                existing.name = name
                existing.size = stat.st_size
                existing.file_type = file_type
                existing.mime_type = mime_type
                existing.content_preview = content_preview
                existing.search_vector = search_vector
                existing.modified_at = datetime.fromtimestamp(stat.st_mtime)
                existing.last_scanned = datetime.utcnow()
        else:
            # Créer une nouvelle entrée
            new_file = FileMetadata(
                path=relative_path,
                name=name,
                is_directory=is_directory,
                parent_path=parent_path,
                size=stat.st_size,
                file_type=file_type,
                mime_type=mime_type,
                content_preview=content_preview,
                search_vector=search_vector,
                created_at=datetime.fromtimestamp(stat.st_ctime),
                modified_at=datetime.fromtimestamp(stat.st_mtime),
                last_scanned=datetime.utcnow()
            )
            self.db.add(new_file)

    def search_files(self, query: str, limit: int = 5) -> List[FileMetadata]:
        """Recherche rapide dans les métadonnées"""
        if not query or len(query.strip()) < 1:
            return []
        
        query = query.strip().lower()
        
        # Recherche dans le vecteur de recherche (nom, chemin, contenu)
        results = self.db.query(FileMetadata).filter(
            or_(
                FileMetadata.name.ilike(f"%{query}%"),
                FileMetadata.path.ilike(f"%{query}%"),
                FileMetadata.search_vector.ilike(f"%{query}%")
            )
        ).order_by(
            # Prioriser les correspondances exactes
            FileMetadata.name.ilike(f"{query}").desc(),
            FileMetadata.name.ilike(f"{query}%").desc(),
            # Puis les fichiers avant les dossiers
            FileMetadata.is_directory.asc(),
            # Enfin par nom
            FileMetadata.name.asc()
        ).limit(limit).all()
        
        return results

    def get_file_content(self, relative_path: str) -> Optional[str]:
        """Charge le contenu d'un fichier à la demande"""
        full_path = self.domains_root / relative_path
        
        if not full_path.exists() or full_path.is_dir():
            return None
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {relative_path}: {e}")
            return None

    def save_file_content(self, relative_path: str, content: str) -> bool:
        """Sauvegarde le contenu d'un fichier"""
        full_path = self.domains_root / relative_path
        
        try:
            # Créer les dossiers parents si nécessaire
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Mettre à jour les métadonnées
            self._sync_file_metadata(relative_path, False)
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error saving file {relative_path}: {e}")
            return False

    def get_directory_tree(self, path: str = "") -> List[dict]:
        """Récupère l'arbre des dossiers depuis la BDD"""
        if path:
            # Dossier spécifique
            files = self.db.query(FileMetadata).filter(
                and_(
                    FileMetadata.parent_path == path,
                    FileMetadata.is_directory == False
                )
            ).order_by(FileMetadata.name).all()
            
            dirs = self.db.query(FileMetadata).filter(
                and_(
                    FileMetadata.parent_path == path,
                    FileMetadata.is_directory == True
                )
            ).order_by(FileMetadata.name).all()
        else:
            # Racine
            files = self.db.query(FileMetadata).filter(
                and_(
                    FileMetadata.parent_path == "",
                    FileMetadata.is_directory == False
                )
            ).order_by(FileMetadata.name).all()
            
            dirs = self.db.query(FileMetadata).filter(
                and_(
                    FileMetadata.parent_path == "",
                    FileMetadata.is_directory == True
                )
            ).order_by(FileMetadata.name).all()
        
        # Convertir en format attendu par le frontend
        result = []
        
        # Ajouter les dossiers
        for dir_meta in dirs:
            result.append({
                "name": dir_meta.name,
                "isDir": True,
                "path": dir_meta.path,
                "size": dir_meta.size,
                "modified_at": dir_meta.modified_at.isoformat() if dir_meta.modified_at else None
            })
        
        # Ajouter les fichiers
        for file_meta in files:
            result.append({
                "name": file_meta.name,
                "isDir": False,
                "path": file_meta.path,
                "size": file_meta.size,
                "file_type": file_meta.file_type,
                "mime_type": file_meta.mime_type,
                "modified_at": file_meta.modified_at.isoformat() if file_meta.modified_at else None
            })
        
        return result
