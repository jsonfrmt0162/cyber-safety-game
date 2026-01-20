from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.deps import require_admin
from app.auth import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_admin": u.is_admin,
            "age": u.age,
            "birthday": str(u.birthday),
            "is_blocked": bool(getattr(u, "is_blocked", False)),
            "blocked_reason": getattr(u, "blocked_reason", None),
        }
        for u in users
    ]


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_scores = db.query(func.count(models.Score.id)).scalar() or 0
    players_with_scores = db.query(func.count(distinct(models.Score.user_id))).scalar() or 0

    total_blocked = 0
    if hasattr(models.User, "is_blocked"):
        total_blocked = db.query(func.count(models.User.id)).filter(models.User.is_blocked == True).scalar() or 0

    return {
        "total_users": total_users,
        "total_scores": total_scores,
        "top_players": players_with_scores,
        "total_blocked": total_blocked,
    }


@router.post("/make-admin/{user_id}")
def make_admin(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"message": f"{user.username} is now an admin ✅"}


@router.get("/users/{user_id}/progress")
def user_progress(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(models.Score.game_id, func.max(models.Score.score))
        .filter(models.Score.user_id == user_id)
        .group_by(models.Score.game_id)
        .all()
    )
    best_scores = {gid: score for gid, score in rows}
    return {"best_scores": best_scores}


# ✅ NEW: block user
@router.post("/users/{user_id}/block")
def block_user(user_id: int, payload: dict = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="You cannot block an admin.")

    reason = None
    if payload and isinstance(payload, dict):
        reason = payload.get("reason")

    user.is_blocked = True
    user.blocked_reason = reason or "Blocked by admin"
    if hasattr(user, "blocked_at"):
        user.blocked_at = datetime.utcnow()

    db.commit()
    return {"message": f"{user.username} blocked ✅"}


# ✅ NEW: unblock user
@router.post("/users/{user_id}/unblock")
def unblock_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_blocked = False
    user.blocked_reason = None
    if hasattr(user, "blocked_at"):
        user.blocked_at = None

    db.commit()
    return {"message": f"{user.username} unblocked ✅"}


# ✅ OPTIONAL: suspicious list (for now just show blocked or future “failed logins”)
@router.get("/users/suspicious")
def suspicious_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    # If you later add failed_login_attempts, you can include it here.
    rows = db.query(models.User).filter(models.User.is_blocked == True).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_blocked": u.is_blocked,
            "blocked_reason": u.blocked_reason,
            "failed_login_attempts": getattr(u, "failed_login_attempts", 0),
        }
        for u in rows
    ]

@router.post("/users_create", status_code=201)
def admin_create_user(
    payload: schemas.AdminCreateUser,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    # same rule as register
    if payload.age < 13 or payload.age > 17:
        raise HTTPException(status_code=400, detail="Age must be between 13 and 17.")

    # unique checks
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = models.User(
        username=payload.username,
        email=payload.email,
        password=hash_password(payload.password),  # ✅ store hashed
        birthday=payload.birthday,
        age=payload.age,
        is_admin=payload.is_admin,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "is_admin": new_user.is_admin,
        "age": new_user.age,
        "birthday": str(new_user.birthday),
        "is_blocked": bool(getattr(new_user, "is_blocked", False)),
        "blocked_reason": getattr(new_user, "blocked_reason", None),
    }
