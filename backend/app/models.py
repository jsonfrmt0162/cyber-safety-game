# app/models.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  

    birthday = Column(Date, nullable=False)
    age = Column(Integer, nullable=False)

    # overall highest score across all games
    high_score = Column(Integer, default=0)

    scores = relationship("Score", back_populates="user")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    emoji = Column(String, nullable=False)

    scores = relationship("Score", back_populates="game")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    game_id = Column(Integer, ForeignKey("games.id"))
    score = Column(Integer, nullable=False)

    user = relationship("User", back_populates="scores")
    game = relationship("Game", back_populates="scores")
