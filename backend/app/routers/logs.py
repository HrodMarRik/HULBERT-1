from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import os
import glob
from datetime import datetime, timedelta
import json

from ..security import get_current_user
from .. import models
# from ..services.logger import accounting_logger

router = APIRouter(prefix="/api/logs", tags=["logs"])

class LogEntry:
    def __init__(self, timestamp: str, level: str, module: str, message: str, request_id: Optional[str] = None):
        self.timestamp = timestamp
        self.level = level
        self.module = module
        self.message = message
        self.request_id = request_id

def parse_log_line(line: str) -> Optional[LogEntry]:
    """Parse une ligne de log au format standard"""
    try:
        # Format: 2024-10-21 21:30:45 | INFO     | accounting      | message
        parts = line.split(' | ', 3)
        if len(parts) >= 4:
            timestamp = parts[0]
            level = parts[1].strip()
            module = parts[2].strip()
            message = parts[3].strip()
            
            # Extraire request_id si présent
            request_id = None
            if '[REQUEST' in message:
                start = message.find('[REQUEST ') + 9
                end = message.find(']', start)
                if end > start:
                    request_id = message[start:end]
            
            return LogEntry(timestamp, level, module, message, request_id)
    except:
        pass
    return None

@router.get("/files")
def get_log_files(user: models.User = Depends(get_current_user)):
    """Récupère la liste des fichiers de logs disponibles avec descriptions"""
    log_dir = "backend/logs"
    if not os.path.exists(log_dir):
        return {"files": []}
    
    # Mapping des types de logs vers des descriptions lisibles
    log_descriptions = {
        "api": "🌐 Logs API - Requêtes et réponses HTTP",
        "accounting": "💰 Logs Comptabilité - Opérations comptables",
        "payroll": "👥 Logs Paie - Calculs et bulletins de paie", 
        "invoicing": "📄 Logs Facturation - Factures et devis",
        "social": "🏛️ Logs Déclarations Sociales - DSN et URSSAF",
        "errors": "❌ Logs d'Erreurs - Erreurs système critiques",
        "debug": "🔍 Logs Debug - Informations de débogage",
        "general": "📝 Logs Généraux - Activité système"
    }
    
    files = []
    for file_path in glob.glob(f"{log_dir}/*.log"):
        filename = os.path.basename(file_path)
        stat = os.stat(file_path)
        
        # Extraire le type et la date du nom de fichier
        file_type = filename.split('_')[0] if '_' in filename else 'general'
        date_part = filename.replace(f"{file_type}_", "").replace(".log", "")
        
        # Créer un nom lisible
        readable_name = f"{log_descriptions.get(file_type, '📝 Logs')} - {date_part}"
        
        files.append({
            "filename": filename,
            "readable_name": readable_name,
            "description": log_descriptions.get(file_type, "Logs système"),
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "type": file_type,
            "date": date_part
        })
    
    # Trier par date de modification (plus récent en premier)
    files.sort(key=lambda x: x["modified"], reverse=True)
    
    return {"files": files}

@router.get("/entries")
def get_log_entries(
    file: str = Query(..., description="Nom du fichier de log"),
    level: Optional[str] = Query(None, description="Filtrer par niveau (DEBUG, INFO, WARNING, ERROR)"),
    module: Optional[str] = Query(None, description="Filtrer par module"),
    limit: int = Query(100, description="Nombre maximum d'entrées à retourner"),
    offset: int = Query(0, description="Décalage pour la pagination"),
    user: models.User = Depends(get_current_user)
):
    """Récupère les entrées de logs d'un fichier"""
    log_dir = "backend/logs"
    file_path = os.path.join(log_dir, file)
    
    # Vérification de sécurité
    if not file_path.startswith(log_dir) or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fichier de log non trouvé")
    
    entries = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
            # Parser les lignes
            parsed_entries = []
            for line in lines:
                entry = parse_log_line(line.strip())
                if entry:
                    parsed_entries.append(entry)
            
            # Appliquer les filtres
            filtered_entries = parsed_entries
            if level:
                filtered_entries = [e for e in filtered_entries if e.level.upper() == level.upper()]
            if module:
                filtered_entries = [e for e in filtered_entries if module.lower() in e.module.lower()]
            
            # Appliquer la pagination
            total = len(filtered_entries)
            paginated_entries = filtered_entries[offset:offset + limit]
            
            # Convertir en dictionnaires
            for entry in paginated_entries:
                entries.append({
                    "timestamp": entry.timestamp,
                    "level": entry.level,
                    "module": entry.module,
                    "message": entry.message,
                    "request_id": entry.request_id
                })
            
            return {
                "entries": entries,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la lecture du fichier: {str(e)}")

@router.get("/stats")
def get_log_stats(user: models.User = Depends(get_current_user)):
    """Récupère les statistiques des logs"""
    log_dir = "backend/logs"
    if not os.path.exists(log_dir):
        return {"stats": {}}
    
    stats = {
        "total_files": 0,
        "total_size": 0,
        "files_by_type": {},
        "recent_activity": {}
    }
    
    # Analyser tous les fichiers de logs
    for file_path in glob.glob(f"{log_dir}/*.log"):
        filename = os.path.basename(file_path)
        stat = os.stat(file_path)
        
        stats["total_files"] += 1
        stats["total_size"] += stat.st_size
        
        # Compter par type
        file_type = filename.split('_')[0] if '_' in filename else 'general'
        if file_type not in stats["files_by_type"]:
            stats["files_by_type"][file_type] = {"count": 0, "size": 0}
        stats["files_by_type"][file_type]["count"] += 1
        stats["files_by_type"][file_type]["size"] += stat.st_size
        
        # Activité récente (dernière modification)
        modified_date = datetime.fromtimestamp(stat.st_mtime).date()
        if modified_date not in stats["recent_activity"]:
            stats["recent_activity"][modified_date.isoformat()] = 0
        stats["recent_activity"][modified_date.isoformat()] += 1
    
    return {"stats": stats}

@router.get("/search")
def search_logs(
    query: str = Query(..., description="Terme de recherche"),
    file: Optional[str] = Query(None, description="Fichier spécifique à rechercher"),
    level: Optional[str] = Query(None, description="Niveau de log"),
    limit: int = Query(50, description="Nombre maximum de résultats"),
    user: models.User = Depends(get_current_user)
):
    """Recherche dans les logs"""
    log_dir = "backend/logs"
    
    if file:
        files_to_search = [os.path.join(log_dir, file)]
    else:
        files_to_search = glob.glob(f"{log_dir}/*.log")
    
    results = []
    
    for file_path in files_to_search:
        if not os.path.exists(file_path):
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
                for line_num, line in enumerate(lines, 1):
                    if query.lower() in line.lower():
                        entry = parse_log_line(line.strip())
                        if entry:
                            # Appliquer le filtre de niveau si spécifié
                            if level and entry.level.upper() != level.upper():
                                continue
                                
                            results.append({
                                "file": os.path.basename(file_path),
                                "line": line_num,
                                "timestamp": entry.timestamp,
                                "level": entry.level,
                                "module": entry.module,
                                "message": entry.message,
                                "request_id": entry.request_id
                            })
                            
                            if len(results) >= limit:
                                break
                                
        except Exception as e:
            continue
    
    return {
        "query": query,
        "results": results[:limit],
        "total_found": len(results)
    }

@router.post("/clear")
def clear_old_logs(
    days: int = Query(30, description="Nombre de jours à conserver"),
    user: models.User = Depends(get_current_user)
):
    """Supprime les anciens fichiers de logs"""
    # Vérifier que l'utilisateur a les permissions (admin seulement)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    log_dir = "backend/logs"
    if not os.path.exists(log_dir):
        return {"message": "Aucun fichier de log à supprimer"}
    
    cutoff_date = datetime.now() - timedelta(days=days)
    deleted_files = []
    
    for file_path in glob.glob(f"{log_dir}/*.log"):
        file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
        if file_time < cutoff_date:
            try:
                os.remove(file_path)
                deleted_files.append(os.path.basename(file_path))
            except Exception as e:
                continue
    
    return {
        "message": f"{len(deleted_files)} fichiers supprimés",
        "deleted_files": deleted_files
    }
