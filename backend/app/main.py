# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import users, game, scores, feedback
from app.database import engine, SessionLocal
from app import models
from app.routes import admin

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cyber Safety Game API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cyber-safety-frontend.onrender.com", 
    "https://cyberquestto.com",
    "https://www.cyberquestto.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def seed_games():
    """
    Seed 4 games that map to your module topics:
    1. Digital Footprint
    2. Personal Information & Privacy
    3. Passwords & Passphrases
    4. Social Media & Privacy Settings
    """
    db = SessionLocal()
    try:
        if db.query(models.Game).count() == 0:
            games = [
                models.Game(id=1, title="My Digital Footprint", emoji="👣"),
                models.Game(id=2, title="Personal Info & Privacy", emoji="🧰"),
                models.Game(id=3, title="Passwords & Passphrases", emoji="🔐"),
                models.Game(id=4, title="Social Media Safety", emoji="📱"),
            ]
            db.add_all(games)
            db.commit()
    finally:
        db.close()


app.include_router(users.router)
app.include_router(game.router)
app.include_router(scores.router)
app.include_router(admin.router)
app.include_router(feedback.router)

@app.get("/")
def root():
    return {"message": "Backend running"}
