from passlib.hash import bcrypt
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "CHANGE_THIS_SECRET"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    # Truncate to 72 characters for bcrypt
    return bcrypt.hash(password[:72])

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password[:72], hashed)

def create_token(data: dict, hours_valid: int = 2) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=hours_valid)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
