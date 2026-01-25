from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.deps import get_current_user
from app.schemas import AccountUpdate

router = APIRouter(prefix="/account", tags=["Account"])

@router.patch("", status_code=200)
def update_account(
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # load fresh user
    u = db.query(models.User).filter(models.User.id == user.id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    # verify current password (PLAINTEXT as requested)
    if u.password != payload.current_password:
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # username update
    if payload.username and payload.username != u.username:
        exists = (
            db.query(models.User)
            .filter(models.User.username == payload.username, models.User.id != u.id)
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Username already taken")
        u.username = payload.username

    # password update
    if payload.new_password:
        u.password = payload.new_password

    db.commit()
    db.refresh(u)

    return {
        "message": "Account updated successfully ✅",
        "username": u.username,
    }
