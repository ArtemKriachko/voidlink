from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, HttpUrl, Field


class UserCreate(BaseModel):
    username: str
    password: str

class UserCreateTelegram(UserCreate):
    telegram_id: int

class UserInfo(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)

class URLCreate(BaseModel):
    target_url: str

class CheckURL(URLCreate):
    target_url: HttpUrl = Field(..., description="Повинно бути валідне посилання")

class URLInfo(BaseModel):
    id: int
    full_url: str
    short_key: str
    clicks: int
    created_at: datetime
    qr_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UsernameChange(BaseModel):
    old_username: str
    new_username: str