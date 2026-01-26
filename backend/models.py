from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, BigInteger
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    urls = relationship("URL", back_populates="owner")
    telegram_id = Column(BigInteger, unique=True, nullable=True)


class URL(Base):
    __tablename__ = "urls"
    id = Column(Integer, primary_key=True, index=True)
    full_url = Column(String)
    short_key = Column(String, unique=True, index=True)
    clicks = Column(Integer, default=0)
    qr_code = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="urls")

