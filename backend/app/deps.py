from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app import models
from app.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise creds_error
    except JWTError:
        raise creds_error

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise creds_error
    return user


def require_admin(user=Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def get_current_admin_user(
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
