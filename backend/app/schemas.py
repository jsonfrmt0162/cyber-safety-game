# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List


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
    is_blocked: bool
    blocked_reason: Optional[str] = None
    failed_login_attempts: int
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None

    class Config:
        orm_mode = True

class BlockUserRequest(BaseModel):
    reason: Optional[str] = "Blocked by admin"

class AdminReportOut(BaseModel):
    total_users: int
    total_blocked: int
    total_suspicious: int
    top_scores: list

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

class AdminCreateUser(BaseModel):
    username: str
    email: EmailStr
    password: str
    birthday: date
    age: int
    is_admin: bool = False

class FeedbackCreate(BaseModel):
    topic_id: int
    rating: Optional[int] = None
    category: Optional[str] = None
    message: str
    screenshot_url: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    user_id: int
    topic_id: int
    rating: Optional[int]
    category: Optional[str]
    message: str
    screenshot_url: Optional[str]
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AdminUserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)

class AccountUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=30)
    current_password: str = Field(min_length=3, max_length=200) 
    new_password: Optional[str] = Field(default=None, min_length=3, max_length=200)