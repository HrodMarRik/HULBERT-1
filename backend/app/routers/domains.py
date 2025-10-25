import os
import pathlib
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body

from ..config import get_settings
from ..security import get_current_user

router = APIRouter(prefix="/api/domains", tags=["domains"])  # Force reload 2




@router.get("/tree")
def list_tree(path: Optional[str] = None, user=Depends(get_current_user)):
    settings = get_settings()
    root = pathlib.Path(settings.domains_root).resolve()
    
    # Use simple path resolution instead of _safe_path
    if path:
        target = root / path
    else:
        target = root
    
    target = target.resolve()
    
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    
    items = []
    for entry in sorted(target.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
        items.append({
            "name": entry.name,
            "isDir": entry.is_dir(),
            "path": str(entry.relative_to(root))
        })
    return {"path": str(target.relative_to(root)), "items": items}


@router.get("/file")
def read_file(path: str, user=Depends(get_current_user)):
    settings = get_settings()
    root = pathlib.Path(settings.domains_root).resolve()
    target = root / path
    target = target.resolve()
    
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Limit allowed extensions
    allowed = {".md", ".txt", ".json", ".html", ".scss", ".ts"}
    if target.suffix not in allowed:
        raise HTTPException(status_code=400, detail="Disallowed extension")
    
    return {"path": path, "content": target.read_text(encoding="utf-8")}


@router.put("/file")
def write_file(path: str = Body(...), content: str = Body(...), user=Depends(get_current_user)):
    settings = get_settings()
    root = pathlib.Path(settings.domains_root).resolve()
    target = root / path
    target = target.resolve()

    if not target.parent.exists():
        raise HTTPException(status_code=404, detail="Parent folder not found")

    # Atomic write
    tmp_path = target.with_suffix(target.suffix + ".tmp")
    tmp_path.write_text(content, encoding="utf-8")
    tmp_path.replace(target)
    return {"ok": True}


@router.post("/file")
def create_file(path: str = Body(...), content: str = Body(""), user=Depends(get_current_user)):
    settings = get_settings()
    root = pathlib.Path(settings.domains_root).resolve()
    target = root / path
    target = target.resolve()
    
    if target.exists():
        raise HTTPException(status_code=400, detail="Already exists")
    if not target.parent.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return {"ok": True}


@router.post("/rename")
def rename_path(oldPath: str = Body(...), newPath: str = Body(...), user=Depends(get_current_user)):
    settings = get_settings()
    root = pathlib.Path(settings.domains_root).resolve()
    src = root / oldPath
    dst = root / newPath
    src = src.resolve()
    dst = dst.resolve()
    
    if not src.exists():
        raise HTTPException(status_code=404, detail="Source not found")
    if dst.exists():
        raise HTTPException(status_code=400, detail="Destination exists")
    dst.parent.mkdir(parents=True, exist_ok=True)
    src.replace(dst)
    return {"ok": True}


@router.delete("/file")
def delete_path(path: str, user=Depends(get_current_user)):
    settings = get_settings()
    root = pathlib.Path(settings.domains_root).resolve()
    target = root / path
    target = target.resolve()
    
    if not target.exists():
        return {"ok": True}
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Directories not allowed here")
    target.unlink()
    return {"ok": True}
