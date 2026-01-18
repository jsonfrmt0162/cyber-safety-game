# app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app import schemas, models, database
from app.auth import hash_password, verify_password, create_access_token
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register")
def register(user: schemas.UserRegister, db: Session = Depends(database.get_db)):
    if user.age < 13 or user.age > 17:
        raise HTTPException(status_code=400, detail="Age must be between 13 and 17.")

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password, 
        birthday=user.birthday,
        age=user.age
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@router.post("/login")
def login(data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        # ✅ track failed attempts if user exists
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ if blocked, deny
    if user.is_blocked:
        raise HTTPException(status_code=403, detail=f"Account blocked: {user.blocked_reason or 'Contact admin'}")

    # ✅ reset failed attempts + store login metadata
    user.failed_login_attempts = 0
    user.last_login_at = datetime.utcnow()
    user.last_login_ip = request.client.host if request.client else None
    db.commit()

    # ✅ real JWT token
    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "is_admin": user.is_admin,
    }
