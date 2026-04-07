from __future__ import annotations

import os
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import DBCourse, DBMaterial, MATERIAL_UPLOAD_DIR, get_db
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.post("/upload/{course_id}")
def upload_material(course_id: str, file: UploadFile = File(...), current_user: dict = Depends(require_roles("teacher")), db: Session = Depends(get_db)):
    course = db.query(DBCourse).filter(DBCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    course_dir = os.path.join(MATERIAL_UPLOAD_DIR, course_id)
    os.makedirs(course_dir, exist_ok=True)
    filename = file.filename or "unknown.txt"
    file_path = os.path.join(course_dir, filename)
    content_bytes = file.file.read()
    with open(file_path, "wb") as output:
        output.write(content_bytes)

    ext = os.path.splitext(filename)[1].lower()
    text_content = ""
    if ext in {".txt", ".md", ".csv", ".json"}:
        for encoding in ["utf-8", "gbk", "utf-8-sig"]:
            try:
                text_content = content_bytes.decode(encoding)
                break
            except Exception:
                continue
        if not text_content:
            text_content = content_bytes.decode("utf-8", errors="replace")

    row = DBMaterial(course_id=course_id, filename=filename, content=text_content, file_type=ext, file_path=file_path, created_at=datetime.now().isoformat())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "filename": filename, "file_type": ext, "size": len(content_bytes), "message": "上传成功"}


@router.get("/{course_id}")
def list_materials(course_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(DBMaterial).filter(DBMaterial.course_id == course_id).order_by(DBMaterial.created_at.desc()).all()
    return [{"id": row.id, "filename": row.filename, "file_type": row.file_type, "created_at": row.created_at} for row in rows]
