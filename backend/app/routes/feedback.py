from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import get_db
from app import models
from app.deps import get_current_user, require_admin

router = APIRouter(prefix="/feedback", tags=["Feedback"])


# ----------------------------
# Schemas (keep here or move to app/schemas.py)
# ----------------------------
class FeedbackCreate(BaseModel):
    topic_id: int = Field(..., ge=1, le=4)  # since you have 4 topics
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    category: Optional[str] = Field(default="other", max_length=50)
    message: str = Field(..., min_length=3, max_length=2000)
    screenshot_url: Optional[str] = Field(default=None, max_length=500)


class FeedbackOut(BaseModel):
    id: int
    user_id: int
    topic_id: int
    rating: Optional[int] = None
    category: Optional[str] = None
    message: str
    screenshot_url: Optional[str] = None
    created_at: datetime
    is_resolved: bool

    class Config:
        from_attributes = True


# ----------------------------
# User routes
# ----------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
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


@router.get("/mine", response_model=List[FeedbackOut])
def my_feedback(
    topic_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return (
        db.query(models.Feedback)
        .filter(
            models.Feedback.user_id == user.id,
            models.Feedback.topic_id == topic_id,
        )
        .order_by(models.Feedback.created_at.desc())
        .all()
    )


# ----------------------------
# Admin routes
# ----------------------------

@router.get("/admin", response_model=List[FeedbackOut])
def admin_list_feedback(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return (
        db.query(models.Feedback)
        .order_by(models.Feedback.created_at.desc())
        .all()
    )


@router.post("/admin/{feedback_id}/resolve")
def admin_resolve_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    fb.is_resolved = True
    db.commit()
    return {"message": "Feedback marked as resolved ✅"}
