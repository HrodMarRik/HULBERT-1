import subprocess
import shlex
import json
import asyncio
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel

from ..security import get_current_user
from ..models import AgentMetrics, AgentActivity
from ..schemas import AgentMetricsResponse, AgentActivityResponse
from sqlalchemy.orm import Session
from ..db import get_db

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.get("/test")
def test_endpoint():
    """Endpoint de test sans authentification"""
    return {"message": "API agents fonctionne", "timestamp": "2024-01-01T00:00:00Z"}

@router.get("/test-metrics")
def test_metrics_endpoint():
    """Endpoint de test pour les métriques"""
    return {
        "agent_id": "master",
        "agent_name": "Master Agent",
        "lines_created": 150,
        "lines_deleted": 25,
        "lines_modified": 75,
        "files_processed": 12,
        "files_created": 3,
        "files_deleted": 1,
        "jobs_completed": 8,
        "jobs_failed": 1,
        "total_work_time_seconds": 3600,
        "last_activity": "2024-01-01T12:00:00Z",
        "avg_job_duration_seconds": 450,
        "success_rate": 88.9,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z"
    }

@router.post("/test-master")
def test_master_agent():
    """Test du Master Agent sans authentification"""
    try:
        import shutil
        if not shutil.which("node"):
            return {"error": "Node.js not found", "status": "error"}
        
        result = subprocess.run(
            ["node", ".agents/cli-simple.js", "health"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        return {
            "status": "success" if result.returncode == 0 else "error",
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
        
    except Exception as e:
        return {"error": str(e), "status": "error"}


AGENTS = {
    "master": {"name": "Master Agent", "cmd_start": "node .agents/cli-simple.js health", "cmd_stop": "echo Master Agent stopped"},
    "notion": {"name": "Notion Sync", "cmd_start": "echo Notion Sync started", "cmd_stop": "echo Notion Sync stopped"},
}

# Store for job tracking
JOBS = {}

class ContentFillRequest(BaseModel):
    file_path: str  # Chemin relatif depuis domains/
    user_description: str  # Description de ce que l'utilisateur veut
    source_materials: List[str] = []  # Documents/liens/dossiers fournis
    action_type: str  # "create", "update", "focus", "refactor"

async def call_master_agent(action: str, payload: dict):
    """Appelle le Master Agent Node.js via CLI"""
    try:
        # Construire le chemin vers le CLI
        import os
        # Le CLI est dans le répertoire parent du backend
        project_root = os.path.dirname(os.getcwd())
        cli_path = os.path.join(project_root, '.agents', 'cli-debug.js')
        
        print(f"DEBUG: project_root = {project_root}")
        print(f"DEBUG: cli_path = {cli_path}")
        print(f"DEBUG: cli_path exists = {os.path.exists(cli_path)}")
        
        # Lancer le script Node.js
        proc = await asyncio.create_subprocess_exec(
            'node', cli_path, action, json.dumps(payload),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=project_root  # Exécuter depuis le répertoire parent
        )
        stdout, stderr = await proc.communicate()
        
        print(f"DEBUG: returncode = {proc.returncode}")
        print(f"DEBUG: stdout = {stdout.decode()}")
        print(f"DEBUG: stderr = {stderr.decode()}")
        
        if proc.returncode != 0:
            raise Exception(f"Master Agent error: {stderr.decode()}")
            
        return json.loads(stdout.decode())
    except Exception as e:
        print(f"DEBUG: Exception in call_master_agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to call Master Agent: {str(e)}")


@router.get("")
def list_agents(user=Depends(get_current_user)):
    return [{"id": k, "name": v["name"], "status": "unknown"} for k, v in AGENTS.items()]


@router.post("/{agent_id}/start")
def start_agent(agent_id: str):  # Temporairement sans auth pour les tests
    agent = AGENTS.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # Pour le Master Agent, utiliser le CLI
        if agent_id == "master":
            # Vérifier que Node.js est disponible
            import shutil
            if not shutil.which("node"):
                raise HTTPException(status_code=500, detail="Node.js not found. Please install Node.js to run the Master Agent.")
            
            # Lancer le Master Agent
            result = subprocess.run(
                shlex.split(agent["cmd_start"]),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Master Agent failed to start: {result.stderr}"
                )
            
            return {"ok": True, "output": result.stdout}
        else:
            # Pour les autres agents, commande simple
            subprocess.run(shlex.split(agent["cmd_start"]))
            return {"ok": True}
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Agent start timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start agent: {str(e)}")


@router.post("/{agent_id}/stop")
def stop_agent(agent_id: str, user=Depends(get_current_user)):
    agent = AGENTS.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    subprocess.run(shlex.split(agent["cmd_stop"]))
    return {"ok": True}


@router.get("/{agent_id}/logs")
def get_logs(agent_id: str):  # Temporairement sans auth pour les tests
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Pour le Master Agent, récupérer les logs depuis le CLI
    if agent_id == "master":
        try:
            import os
            from datetime import datetime
            # Quand uvicorn démarre depuis backend/, cwd est backend/
            # Donc le parent est la racine du projet
            backend_dir = os.getcwd()  # C:\Users\somos\Desktop\HULBERT-1\backend
            project_root = os.path.dirname(backend_dir)  # C:\Users\somos\Desktop\HULBERT-1
            cli_path = os.path.join(project_root, '.agents', 'cli-debug.js')
            
            result = subprocess.run(
                ["node", cli_path, "health"],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=project_root
            )
            
            if result.returncode == 0:
                return {
                    "logs": [
                        {"timestamp": "2024-01-01T00:00:00Z", "level": "INFO", "message": "Master Agent health check"},
                        {"timestamp": "2024-01-01T00:00:01Z", "level": "INFO", "message": result.stdout.strip()}
                    ]
                }
            else:
                return {
                    "logs": [
                        {"timestamp": "2024-01-01T00:00:00Z", "level": "ERROR", "message": f"Master Agent error: {result.stderr}"}
                    ]
                }
        except subprocess.TimeoutExpired:
            return {
                "logs": [{
                    "timestamp": datetime.now().isoformat(),
                    "level": "ERROR",
                    "message": "Timeout lors de la récupération des logs (>10s)"
                }]
            }
        except FileNotFoundError as e:
            return {
                "logs": [{
                    "timestamp": datetime.now().isoformat(),
                    "level": "ERROR",
                    "message": f"CLI non trouvé: {cli_path}. Vérifiez que Node.js est installé et que le fichier existe."
                }]
            }
        except Exception as e:
            return {
                "logs": [{
                    "timestamp": datetime.now().isoformat(),
                    "level": "ERROR",
                    "message": f"Erreur lors de la récupération des logs: {str(e)}"
                }]
            }
    
    # Pour les autres agents, logs simulés
    return {
        "logs": [
            {"timestamp": "2024-01-01T00:00:00Z", "level": "INFO", "message": f"{AGENTS[agent_id]['name']} is running"},
            {"timestamp": "2024-01-01T00:00:01Z", "level": "INFO", "message": "Agent status: active"}
        ]
    }

@router.post("/fill-content")
async def fill_content(request: ContentFillRequest):  # Temporairement sans auth pour les tests
    """Lance le remplissage de contenu via le Master Agent"""
    try:
        # Valider le chemin du fichier
        if not request.file_path or not request.file_path.strip():
            raise HTTPException(status_code=400, detail="File path is required")
        
        # Extraire le domaine depuis le chemin
        path_parts = request.file_path.strip('/').split('/')
        if len(path_parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid file path format")
        
        domain = path_parts[0]  # Premier élément = domaine
        
        # Créer un job ID
        job_id = str(uuid.uuid4())
        
        # Enregistrer le job
        JOBS[job_id] = {
            "status": "processing",
            "file_path": request.file_path,
            "domain": domain,
            "created_at": asyncio.get_event_loop().time()
        }
        
        # Préparer la payload pour le Master Agent
        payload = {
            "job_id": job_id,
            "file_path": request.file_path,
            "user_description": request.user_description,
            "source_materials": request.source_materials,
            "action_type": request.action_type,
            "domain": domain
        }
        
        # Lancer le Master Agent de manière asynchrone
        asyncio.create_task(process_content_fill(job_id, payload))
        
        return {"job_id": job_id, "status": "processing", "message": "Content fill job started"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start content fill: {str(e)}")

async def process_content_fill(job_id: str, payload: dict):
    """Traite le remplissage de contenu de manière asynchrone"""
    try:
        # Appeler le Master Agent
        result = await call_master_agent('fill-content', payload)
        
        # Mettre à jour le statut du job
        if job_id in JOBS:
            JOBS[job_id]["status"] = "completed"
            JOBS[job_id]["result"] = result
            JOBS[job_id]["completed_at"] = asyncio.get_event_loop().time()
            
    except Exception as e:
        # Marquer le job comme échoué
        if job_id in JOBS:
            JOBS[job_id]["status"] = "failed"
            JOBS[job_id]["error"] = str(e)
            JOBS[job_id]["failed_at"] = asyncio.get_event_loop().time()

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):  # Temporairement sans auth pour les tests
    """Récupère le statut d'un job de remplissage"""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JOBS[job_id]


@router.get("/{agent_id}/metrics", response_model=AgentMetricsResponse)
def get_agent_metrics(agent_id: str, db: Session = Depends(get_db)):  # Temporairement sans auth
    """Récupère les métriques d'un agent"""
    metrics = db.query(AgentMetrics).filter(AgentMetrics.agent_id == agent_id).first()
    
    if not metrics:
        # Créer des métriques par défaut si elles n'existent pas
        agent = AGENTS.get(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        metrics = AgentMetrics(
            agent_id=agent_id,
            agent_name=agent["name"]
        )
        db.add(metrics)
        db.commit()
        db.refresh(metrics)
    
    return metrics


@router.get("/{agent_id}/activities", response_model=List[AgentActivityResponse])
def get_agent_activities(
    agent_id: str, 
    limit: int = 50,
    db: Session = Depends(get_db)  # Temporairement sans auth
):
    """Récupère l'historique des activités d'un agent"""
    activities = db.query(AgentActivity)\
        .filter(AgentActivity.agent_id == agent_id)\
        .order_by(AgentActivity.timestamp.desc())\
        .limit(limit)\
        .all()
    
    return activities


@router.post("/{agent_id}/metrics/increment")
def increment_agent_metric(
    agent_id: str,
    metric_name: str = Body(...),
    increment_by: int = Body(1),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Incrémente une métrique d'un agent"""
    metrics = db.query(AgentMetrics).filter(AgentMetrics.agent_id == agent_id).first()
    
    if not metrics:
        agent = AGENTS.get(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        metrics = AgentMetrics(agent_id=agent_id, agent_name=agent["name"])
        db.add(metrics)
    
    # Incrémenter la métrique appropriée
    valid_metrics = [
        'lines_created', 'lines_deleted', 'lines_modified',
        'files_processed', 'files_created', 'files_deleted',
        'jobs_completed', 'jobs_failed'
    ]
    
    if metric_name not in valid_metrics:
        raise HTTPException(status_code=400, detail=f"Invalid metric name. Valid: {valid_metrics}")
    
    current_value = getattr(metrics, metric_name)
    setattr(metrics, metric_name, current_value + increment_by)
    metrics.last_activity = datetime.utcnow()
    
    # Recalculer le taux de succès
    total_jobs = metrics.jobs_completed + metrics.jobs_failed
    if total_jobs > 0:
        metrics.success_rate = (metrics.jobs_completed / total_jobs) * 100
    
    db.commit()
    db.refresh(metrics)
    
    return {"ok": True, "new_value": getattr(metrics, metric_name)}
