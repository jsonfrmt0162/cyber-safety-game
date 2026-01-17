# app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import date


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    birthday: date
    age: int


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    birthday: date
    age: int
    high_score: int | None = 0
    is_admin: bool

    class Config:
        orm_mode = True

class AdminStatsOut(BaseModel):
    total_users: int
    total_scores: int
    top_players: int

class GameOut(BaseModel):
    id: int
    title: str
    emoji: str
    is_quiz: bool 

    class Config:
        orm_mode = True


class ScoreIn(BaseModel):
    user_id: int
    game_id: int
    score: int


class ScoreEntry(BaseModel):
    username: str
    score: int
