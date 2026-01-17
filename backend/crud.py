import string
import random
from sqlalchemy.orm import Session
import models
import schemas
import auth


def generate_short_key(length: int = 5):
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


def create_db_url(db: Session, url_address: str, user_id: int):  # додали user_id
    if not url_address.startswith("https://") and not url_address.startswith("https://"):
        url_address = "https://" + url_address

    random_key = generate_short_key()
    db_url = models.URL(full_url=url_address, short_key=random_key, owner_id=user_id)  # записуємо власника
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    return db_url

def update_db_clicks(db: Session, db_url: models.URL):
    db_url.clicks += 1
    db.commit()
    db.refresh(db_url)

def get_db_url_by_key(db: Session, url_key: str):
    return db.query(models.URL).filter(models.URL.short_key == url_key).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pwd = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_pwd)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_db_url(db: Session, short_key: str, user_id: int):
    db_url = db.query(models.URL).filter(
        models.URL.short_key == short_key,
        models.URL.owner_id == user_id
    ).first()

    if db_url:
        db.delete(db_url)
        db.commit()
        return True
    return False