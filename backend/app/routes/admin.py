from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.deps import require_admin

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


@router.post("/make-admin/{user_id}")
def make_admin(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"message": "User not found"}
    user.is_admin = True
    db.commit()
    return {"message": f"{user.username} is now an admin ✅"}
