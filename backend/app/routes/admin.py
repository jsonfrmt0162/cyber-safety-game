from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.deps import require_admin
from sqlalchemy import func, distinct
from app import models


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(models.User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_admin": u.is_admin,
            "age": u.age,
            "birthday": str(u.birthday),
        }
        for u in users
    ]

@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_scores = db.query(func.count(models.Score.id)).scalar() or 0
    players_with_scores = db.query(func.count(distinct(models.Score.user_id))).scalar() or 0

    return {
        "total_users": total_users,
        "total_scores": total_scores,
        "top_players": players_with_scores,  # your UI label says "Players With Scores"
    }

@router.post("/make-admin/{user_id}")
def make_admin(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"message": "User not found"}
    user.is_admin = True
    db.commit()
    return {"message": f"{user.username} is now an admin ✅"}


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_scores = db.query(func.count(models.Score.id)).scalar() or 0
    players_with_scores = db.query(func.count(distinct(models.Score.user_id))).scalar() or 0

    return {
        "total_users": total_users,
        "total_scores": total_scores,
        "top_players": players_with_scores,  # your UI label says "Players With Scores"
    }


@router.get("/users/{user_id}/progress")
def user_progress(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    # Best score per game/topic for this user
    rows = (
        db.query(models.Score.game_id, func.max(models.Score.score))
        .filter(models.Score.user_id == user_id)
        .group_by(models.Score.game_id)
        .all()
    )

    best_scores = {gid: score for gid, score in rows}

    return {"best_scores": best_scores}
