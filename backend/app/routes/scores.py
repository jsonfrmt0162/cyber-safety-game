# app/routes/score.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func 
from app import models, database, schemas

router = APIRouter(prefix="/scores", tags=["Scores"])

# Max scores per game (10 points per question)
# Game 1: 2 questions -> 20, etc.
GAME_MAX_SCORES = {
    1: 60,  # My Digital Footprint
    2: 60,  # Personal Info & Privacy
    3: 50,  # Passwords & Passphrases
    4: 60,  # Social Media Safety
}


@router.post("/")
def submit_score(payload: schemas.ScoreIn, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    game = db.query(models.Game).filter(models.Game.id == payload.game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    existing = db.query(models.Score).filter_by(
        user_id=payload.user_id,
        game_id=payload.game_id
    ).first()

    if existing:
        existing.score = max(existing.score, payload.score)
    else:
        new_score = models.Score(
            user_id=payload.user_id,
            game_id=payload.game_id,
            score=payload.score
        )
        db.add(new_score)

    db.flush()  # make sure changes are visible to the aggregate
    total_best = (
        db.query(func.coalesce(func.sum(models.Score.score), 0))
        .filter(models.Score.user_id == payload.user_id)
        .scalar()
    )

    user.high_score = int(total_best)
    db.commit()

    return {"message": "Score saved", "total_best": total_best}


@router.get("/leaderboard/{game_id}")
def game_leaderboard(game_id: int, db: Session = Depends(database.get_db)):
    results = (
        db.query(models.User.username, models.Score.score)
        .join(models.Score, models.User.id == models.Score.user_id)
        .filter(models.Score.game_id == game_id)
        .order_by(desc(models.Score.score))
        .limit(10)
        .all()
    )

    return [{"username": r[0], "score": r[1]} for r in results]


@router.get("/progress/{user_id}")
def get_user_progress(user_id: int, db: Session = Depends(database.get_db)):
    """
    Per-topic (per-game) progress for one user:
    [
      { game_id, title, emoji, best_score, max_score, percent }
    ]
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    games = db.query(models.Game).all()
    progress_list = []

    for g in games:
        score_obj = (
            db.query(models.Score)
            .filter(models.Score.user_id == user_id, models.Score.game_id == g.id)
            .first()
        )
        best_score = score_obj.score if score_obj else 0
        max_score = GAME_MAX_SCORES.get(g.id, 0)
        percent = int(best_score / max_score * 100) if max_score > 0 else 0

        progress_list.append({
            "game_id": g.id,
            "title": g.title,
            "emoji": g.emoji,
            "best_score": best_score,
            "max_score": max_score,
            "percent": percent,
        })

    return progress_list
