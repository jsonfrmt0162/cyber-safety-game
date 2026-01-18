from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime

from app.database import get_db
from app import models
from app.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# -----------------------------
# Suspicious rules (tweakable)
# -----------------------------
def is_suspicious(u: models.User) -> bool:
    # rule #1: too many failed logins
    if getattr(u, "failed_login_attempts", 0) >= 5:
        return True

    # rule #2: has last login time but missing IP
    last_login_at = getattr(u, "last_login_at", None)
    last_login_ip = getattr(u, "last_login_ip", None)
    if last_login_at is not None and not last_login_ip:
        return True

    return False


# -----------------------------
# USERS LIST
# -----------------------------
@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(models.User).order_by(models.User.id.desc()).all()

    result = []
    for u in users:
        result.append(
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_admin": u.is_admin,
                "age": u.age,
                "birthday": str(u.birthday),

                # ✅ admin moderation fields (safe if missing)
                "is_blocked": getattr(u, "is_blocked", False),
                "blocked_reason": getattr(u, "blocked_reason", None),
                "blocked_at": str(getattr(u, "blocked_at", None)) if getattr(u, "blocked_at", None) else None,

                "failed_login_attempts": getattr(u, "failed_login_attempts", 0),
                "last_login_at": str(getattr(u, "last_login_at", None)) if getattr(u, "last_login_at", None) else None,
                "last_login_ip": getattr(u, "last_login_ip", None),

                "suspicious": is_suspicious(u),
            }
        )

    return result


# -----------------------------
# ADMIN STATS (ONLY ONCE ✅)
# -----------------------------
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
        "top_players": players_with_scores,  # your UI label says "Players With Scores"
        "total_blocked": total_blocked,
    }


# -----------------------------
# MAKE ADMIN (KEEP)
# -----------------------------
@router.post("/make-admin/{user_id}")
def make_admin(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"message": "User not found"}

    user.is_admin = True
    db.commit()
    return {"message": f"{user.username} is now an admin ✅"}


# -----------------------------
# BLOCK / UNBLOCK USERS ✅
# -----------------------------
@router.post("/users/{user_id}/block")
def block_user(user_id: int, payload: dict = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    payload example:
    { "reason": "Cheating / suspicious activity" }
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot block an admin user")

    reason = None
    if payload:
        reason = payload.get("reason")

    # If your model does not have these columns yet, this will error.
    # So make sure you added them to models.py and migrated.
    user.is_blocked = True
    user.blocked_reason = reason or "Blocked by admin"
    user.blocked_at = datetime.utcnow()

    db.commit()
    return {"message": f"User {user.username} blocked ✅"}


@router.post("/users/{user_id}/unblock")
def unblock_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_blocked = False
    user.blocked_reason = None
    user.blocked_at = None

    # reset failed attempts too (optional but recommended)
    if hasattr(user, "failed_login_attempts"):
        user.failed_login_attempts = 0

    db.commit()
    return {"message": f"User {user.username} unblocked ✅"}


# -----------------------------
# SUSPICIOUS USERS ✅
# -----------------------------
@router.get("/users/suspicious")
def suspicious_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(models.User).all()
    flagged = [u for u in users if is_suspicious(u) and not u.is_admin]

    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "age": u.age,
            "is_blocked": getattr(u, "is_blocked", False),
            "failed_login_attempts": getattr(u, "failed_login_attempts", 0),
            "last_login_ip": getattr(u, "last_login_ip", None),
            "last_login_at": str(getattr(u, "last_login_at", None)) if getattr(u, "last_login_at", None) else None,
        }
        for u in flagged
    ]


# -----------------------------
# REPORT SUMMARY ✅
# -----------------------------
@router.get("/report/summary")
def report_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_blocked = 0
    if hasattr(models.User, "is_blocked"):
        total_blocked = db.query(func.count(models.User.id)).filter(models.User.is_blocked == True).scalar() or 0

    users = db.query(models.User).all()
    total_suspicious = len([u for u in users if is_suspicious(u) and not u.is_admin])

    # top scores
    top_scores = (
        db.query(models.Score.user_id, models.Score.game_id, func.max(models.Score.score).label("best"))
        .group_by(models.Score.user_id, models.Score.game_id)
        .order_by(func.max(models.Score.score).desc())
        .limit(10)
        .all()
    )

    return {
        "total_users": total_users,
        "total_blocked": total_blocked,
        "total_suspicious": total_suspicious,
        "top_scores": [{"user_id": u, "game_id": g, "score": s} for (u, g, s) in top_scores],
    }


# -----------------------------
# USER PROGRESS (KEEP)
# -----------------------------
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
