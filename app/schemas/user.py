from pydantic import BaseModel, Field


class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username for registration")
    password: str = Field(..., min_length=6, max_length=100, description="Password (min 6 characters)")


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username for login")
    password: str = Field(..., min_length=6, max_length=100, description="Password")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    user_id: int = Field(..., description="Unique user ID")
    username: str = Field(..., description="Username")
