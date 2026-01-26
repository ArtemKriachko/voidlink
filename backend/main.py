from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_throttle import RateLimiter
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import auth
import crud
import models
import schemas
from database import engine, get_db
from utils import validate_url

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL Shortener Pro", redirect_slashes=False)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AUTH ЕНДПОІНТИ
@app.post("/register", response_model=schemas.UserInfo, tags=["Users"], summary="Register a new user", dependencies=[Depends(RateLimiter(times=3, seconds=600))])
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Registration failed")
    try:
        return crud.create_user(db=db, user=user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User already exists")
    except Exception as e:
        db.rollback()
        print(f"Критическая ошибка: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/token", tags=["Users"], summary="Login", dependencies=[Depends(RateLimiter(times=3, seconds=60))]) ## login
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/user/change-password", tags=["Users"], summary="Change password", dependencies=[Depends(RateLimiter(times=3, seconds=900))])
def change_password(
        data: schemas.PasswordChange,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    if not auth.verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid current password")

    if auth.verify_password(data.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password cannot be the same as the old one")

    current_user.hashed_password = auth.get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@app.post("/user/change-username", tags=["Users"], summary="Change username",
          dependencies=[Depends(RateLimiter(times=3, seconds=600))])
def change_username(
        data: schemas.UsernameChange,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    user_exists = db.query(models.User).filter(models.User.username == data.new_username).first()

    if user_exists:
        raise HTTPException(status_code=400, detail="Username already taken")

    if data.old_username != current_user.username:
        raise HTTPException(status_code=400, detail="Invalid username")

    current_user.username = data.new_username
    db.commit()
    return {"status": "success", "new_username": current_user.username}


# URL ЕНДПОІНТИ

@app.post(
    "/shorten",
    response_model=schemas.URLInfo,
    tags=["Url"],
    summary="Shorten URL",
    dependencies=[Depends(RateLimiter(times=1, seconds=300))]
)
def create_url(
    url: schemas.URLCreate,
    db: Session = Depends(get_db),
    x_telegram_id: Optional[str] = Header(None, alias="X-Telegram-ID"),
    token: Optional[str] = Depends(auth.oauth2_scheme)
):
    user = None
    if x_telegram_id:
        user = db.query(models.User).filter(models.User.telegram_id == int(x_telegram_id)).first()

    if not user and token:
        try:
            user = auth.get_current_user(db, token)
        except Exception:
            pass

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    safe_url = validate_url(url.target_url)
    return crud.create_db_url(db=db, url_address=safe_url, user_id=user.id)



@app.get("/my-urls", response_model=List[schemas.URLInfo], tags=["Url"])
def list_my_urls(
        db: Session = Depends(get_db),
        x_telegram_id: Optional[str] = Header(None, alias="X-Telegram-ID"),
        token: Optional[str] = Depends(auth.oauth2_scheme)
):
    print(f"DEBUG: X-Telegram-ID from header: {x_telegram_id}")
    if x_telegram_id:
        user = db.query(models.User).filter(models.User.telegram_id == int(x_telegram_id)).first()
        print(f"DEBUG: Found user in DB: {user}")
        if user:
            return user.urls

    if token:
        try:
            user = auth.get_current_user(db, token)
            return user.urls
        except Exception:
            pass
    raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/{short_key}", tags=["Url"], summary="Check redirect", dependencies=[Depends(RateLimiter(times=3, seconds=600))])
def redirect(short_key: str, db: Session = Depends(get_db)):
    db_url = crud.get_db_url_by_key(db, url_key=short_key)
    if db_url:
        crud.update_db_clicks(db, db_url)
        return RedirectResponse(db_url.full_url)
    raise HTTPException(status_code=404, detail="Link not found")

@app.delete("/my-urls/{short_key}", tags=["Url"], summary="Delete short url")
def delete_url(
    short_key: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    success = crud.delete_db_url(db, short_key, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Link not found or not yours")
    return {"message": "Deleted successfully"}

@app.get("/my-urls/{short_key}", response_model=schemas.URLInfo, tags=["Url"], summary="Get short url statistic and information")
async def get_url_info(short_key: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_url = db.query(models.URL).filter(
        models.URL.short_key == short_key,
        models.URL.owner_id == current_user.id
    ).first()

    if db_url is None:
        raise HTTPException(status_code=404, detail="URL not found")
    return db_url

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)