from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bookmark, Comment, Like, Review, User
from app.schemas.user import TokenResponse, UserLogin, UserSignup

# JWT Configuration
SECRET_KEY = "libris-super-secret-key-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a hashed password."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: int, username: str) -> str:
    """Generate a JWT token for the user."""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: UserSignup,
    x_device_id: Optional[str] = Header(None, description="Device ID to merge interactions from"),
    device_id: Optional[str] = Query(None, description="Alternative Device ID query param"),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Register a new user.

    - Verifies the username is unique
    - Hashes the password using bcrypt
    - Merges any existing device-based interactions (Likes, Bookmarks, Comments, Reviews)
      associated with the device ID to the new user account.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create new user
    hashed_pwd = hash_password(payload.password)
    user = User(username=payload.username, password_hash=hashed_pwd)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Merge device-based interactions if device ID is provided
    target_device_id = x_device_id or device_id
    if target_device_id:
        db.query(Like).filter(Like.device_id == target_device_id, Like.user_id.is_(None)).update(
            {"user_id": user.id}, synchronize_session=False
        )
        db.query(Bookmark).filter(
            Bookmark.device_id == target_device_id, Bookmark.user_id.is_(None)
        ).update({"user_id": user.id}, synchronize_session=False)
        db.query(Comment).filter(
            Comment.device_id == target_device_id, Comment.user_id.is_(None)
        ).update({"user_id": user.id}, synchronize_session=False)
        db.query(Review).filter(
            Review.device_id == target_device_id, Review.user_id.is_(None)
        ).update({"user_id": user.id}, synchronize_session=False)
        db.commit()

    token = create_access_token(user.id, user.username)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Authenticate a user.

    - Verifies username exists
    - Verifies password matches the hash
    - Returns a JWT access token
    """
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(user.id, user.username)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
    )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Validate token and return current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

