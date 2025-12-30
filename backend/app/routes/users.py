# app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models, database

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register")
def register(user: schemas.UserRegister, db: Session = Depends(database.get_db)):
    # Age restriction (e.g. 11–17 as per module target)
    if user.age < 11 or user.age > 17:
        raise HTTPException(status_code=400, detail="Age must be between 11 and 17.")

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password,  # ⚠ plaintext for demo only
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

    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Simplified "token" for demo
    return {
        "access_token": "dummy-token",
        "user_id": user.id,
        "username": user.username
    }
