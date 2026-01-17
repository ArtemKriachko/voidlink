import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
import auth
from database import get_db, engine



models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL Shortener Pro", redirect_slashes=False)


from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"], # Дозволяємо всі методи (OPTIONS, POST, GET і т.д.)
    allow_headers=["*"], # Дозволяємо всі заголовки
)

# --- AUTH ЕНДПОІНТИ ---

@app.post("/register", response_model=schemas.UserInfo, tags=["Users"], summary="Register a new user")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    return crud.create_user(db=db, user=user)


@app.post("/token", tags=["Users"], summary="Login") ## login
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# --- URL ЕНДПОІНТИ ---

@app.post("/shorten", response_model=schemas.URLInfo, tags=["Url"], summary="Shorten URL")
def create_url(
        url: schemas.URLCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_db_url(db=db, url_address=url.target_url, user_id=current_user.id)


@app.get("/my-urls", response_model=List[schemas.URLInfo], tags=["Url"], summary="Get all user urls")
def list_my_urls(current_user: models.User = Depends(auth.get_current_user)):
    return current_user.urls


@app.get("/{short_key}", tags=["Url"], summary="Check redirect")
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


@app.post("/user/change-password", tags=["Url"], summary="Change password")
def change_password(
        data: schemas.PasswordChange,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    # Перевіряємо старий пароль
    if not auth.verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Wrong old password")

    # Хешуємо новий і зберігаємо
    current_user.hashed_password = auth.get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)