from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from app.database import get_db
from app import models
from app.deps import get_current_user, require_admin

router = APIRouter(prefix="/feedback", tags=["Feedback"])

class FeedbackCreate(BaseModel):
    topic_id: int
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    category: Optional[str] = Field(default="other")
    message: str = Field(min_length=3, max_length=2000)
    screenshot_url: Optional[str] = None

@router.post("")
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    fb = models.Feedback(
        user_id=user.id,
        topic_id=payload.topic_id,
        rating=payload.rating,
        category=payload.category,
        message=payload.message,
        screenshot_url=payload.screenshot_url,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"message": "Feedback submitted ✅", "id": fb.id}

@router.get("/mine")
def my_feedback(topic_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = (
        db.query(models.Feedback)
        .filter(models.Feedback.user_id == user.id, models.Feedback.topic_id == topic_id)
        .order_by(models.Feedback.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "topic_id": r.topic_id,
            "rating": r.rating,
            "category": r.category,
            "message": r.message,
            "screenshot_url": r.screenshot_url,
            "created_at": str(r.created_at),
            "is_resolved": r.is_resolved,
        }
        for r in rows
    ]

@router.get("/admin/all")
def all_feedback(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "topic_id": r.topic_id,
            "rating": r.rating,
            "category": r.category,
            "message": r.message,
            "screenshot_url": r.screenshot_url,
            "created_at": str(r.created_at),
            "is_resolved": r.is_resolved,
        }
        for r in rows
    ]



@router.post("/", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    feedback = Feedback(
        user_id=current_user.id,
        topic_id=data.topic_id,
        rating=data.rating,
        category=data.category,
        message=data.message,
        screenshot_url=data.screenshot_url,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {"message": "Feedback submitted successfully"}

@router.get("/admin", response_model=list[FeedbackOut])
def get_all_feedback(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):
    return (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .all()
    )

@router.post("/{feedback_id}/resolve")
def resolve_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.is_resolved = True
    db.commit()

    return {"message": "Feedback marked as resolved"}
