from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, database

router = APIRouter(prefix="/game", tags=["Game"])


@router.get("/dashboard/{user_id}", response_model=schemas.UserOut)
def get_user_dashboard(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/leaderboard")
def get_global_leaderboard(db: Session = Depends(database.get_db)):
    users = (
        db.query(models.User)
        .order_by(models.User.high_score.desc())
        .limit(10)
        .all()
    )
    return [
        {"id": u.id, "username": u.username, "high_score": u.high_score or 0}
        for u in users
    ]


@router.get("/list", response_model=list[schemas.GameOut])
def list_games(db: Session = Depends(database.get_db)):
    games = db.query(models.Game).all()
    return games
