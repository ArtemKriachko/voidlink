from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserInfo(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)

class URLCreate(BaseModel):
    target_url: str

class URLInfo(BaseModel):
    id: int
    full_url: str
    short_key: str
    clicks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PasswordChange(BaseModel):
    old_password: str
    new_password: str