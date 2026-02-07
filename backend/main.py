from typing import List, Optional
import httpx
import os
from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_throttle import RateLimiter
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime

import auth
import crud
import models
import schemas
from database import engine, get_db
from utils import validate_url, get_url_id

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

async def send_error_to_dev_telegram(error_report):
    tg_id = os.getenv("TG_ID")
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    tg_url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
            "chat_id": tg_id,
            "text": error_report,
            "parse_mode": "Markdown"
        }
    async with httpx.AsyncClient() as client:
        try:
            await client.post(tg_url, json=payload)
        except Exception as e:
            print(f"Ошибка отправки лога в Telegram: {e}")


async def log_test(e: Exception, endpoint: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    error_report = (
        f"❌ **VoidLink Error**\n"
        f"**Endpoint:** {endpoint}\n"
        f"**Error details:** `{str(e)}`"
        f"**Timestamp:** `{timestamp}`"
    )
    await send_error_to_dev_telegram(error_report)


# AUTH ЕНДПОІНТИ
@app.post("/register", response_model=schemas.UserInfo, tags=["Users"], summary="Register a new user",
          dependencies=[Depends(RateLimiter(times=3, seconds=600))])
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:

        if not user.username or not user.password:
            raise HTTPException(status_code=400, detail="Password or username is required.")


        db_user = crud.get_user_by_username(db, username=user.username)
        if db_user:
            raise HTTPException(status_code=400, detail="User already exists")

        return crud.create_user(db=db, user=user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User already exists")

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        db.rollback()
        await log_test(e, endpoint="/register")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )

@app.post("/token", tags=["Users"], summary="Login", dependencies=[Depends(RateLimiter(times=3, seconds=60))]) ## login
async def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = crud.get_user_by_username(db, username=form_data.username)
        if not user or not auth.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = auth.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        await log_test(e, endpoint="/token(login)")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )

@app.post("/user/change-password", tags=["Users"], summary="Change password", dependencies=[Depends(RateLimiter(times=3, seconds=900))])
async def change_password(
        data: schemas.PasswordChange,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    try:
        if not auth.verify_password(data.old_password, current_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid current password")

        if auth.verify_password(data.new_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="New password cannot be the same as the old one")

        current_user.hashed_password = auth.get_password_hash(data.new_password)
        db.commit()
        return {"message": "Password updated successfully"}

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        db.rollback()
        await log_test(e, endpoint="/user/change-password")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )


@app.post("/user/change-username", tags=["Users"], summary="Change username",
          dependencies=[Depends(RateLimiter(times=3, seconds=600))])
async def change_username(
        data: schemas.UsernameChange,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    try:
        user_exists = db.query(models.User).filter(models.User.username == data.new_username).first()

        if user_exists:
            raise HTTPException(status_code=400, detail="Username already taken")

        if data.old_username != current_user.username:
            raise HTTPException(status_code=400, detail="Invalid username")

        current_user.username = data.new_username
        db.commit()
        return {"status": "success", "new_username": current_user.username}

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        db.rollback()
        await log_test(e, endpoint="/user/change-username")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )


# URL ЕНДПОІНТИ

@app.post(
    "/shorten",
    response_model=schemas.URLInfo,
    tags=["Url"],
    summary="Shorten URL",
    dependencies=[Depends(RateLimiter(times=1, seconds=300))]
)
async def create_url(
    url: schemas.URLCreate,
    db: Session = Depends(get_db),
    x_telegram_id: Optional[str] = Header(None, alias="X-Telegram-ID"),
    token: Optional[str] = Depends(auth.oauth2_scheme)
):
    try:
        user = None
        if x_telegram_id:
            user = db.query(models.User).filter(models.User.telegram_id == int(x_telegram_id)).first()

        if not user and token:
            user = auth.get_current_user(db, token)

        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        safe_url = validate_url(url.target_url)
        return crud.create_db_url(db=db, url_address=safe_url, user_id=user.id)

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        await log_test(e, endpoint="/create_url")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )



@app.get("/my-urls", response_model=List[schemas.URLInfo], tags=["Url"])
async def list_my_urls(
        db: Session = Depends(get_db),
        x_telegram_id: Optional[str] = Header(None, alias="X-Telegram-ID"),
        token: Optional[str] = Depends(auth.oauth2_scheme)
):
    print(f"DEBUG: X-Telegram-ID from header: {x_telegram_id}")
    try:
        if x_telegram_id:
            user = db.query(models.User).filter(models.User.telegram_id == int(x_telegram_id)).first()
            print(f"DEBUG: Found user in DB: {user}")
            if user:
                return user.urls

        if token:
            user = auth.get_current_user(db, token)
            return user.urls

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        await log_test(e, endpoint="/my-urls")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )

@app.get("/{short_key}", tags=["Url"], summary="Check redirect", dependencies=[Depends(RateLimiter(times=3, seconds=600))])
async def redirect(short_key: str, db: Session = Depends(get_db)):
    try:
        db_url = crud.get_db_url_by_key(db, url_key=short_key)
        if db_url:
            crud.update_db_clicks(db, db_url)
            return RedirectResponse(db_url.full_url)

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        await log_test(e, endpoint="/{short_key}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )

@app.delete("/my-urls/{short_key}", tags=["Url"], summary="Delete short url")
async def delete_url(
    short_key: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        crud.delete_db_url(db, short_key, current_user.id)
        return {"message": "Deleted successfully"}

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        await log_test(e, endpoint="delete /my-urls/{short_key}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )
@app.get("/my-urls/{short_key}", response_model=schemas.URLInfo, tags=["Url"], summary="Get short url statistic and information")
async def get_url_info(short_key: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    try:
        db_url = db.query(models.URL).filter(
            models.URL.short_key == short_key,
            models.URL.owner_id == current_user.id
        ).first()
        return db_url

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        await log_test(e, endpoint="get /my-urls/{short_key}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our side. The developer has been notified."
        )

@app.post("/check_url", summary="Check URL", tags=["Url"])
async def check_url(payload: schemas.CheckURL):
    if payload.target_url in ["http://", "https://", "http:", "https:", "https:/", "http:/"]:
        raise HTTPException(status_code=400, detail="Invalid URL.")

    if not payload.target_url or payload.target_url is None:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        target_url_str = str(payload.target_url)
        safe_url = validate_url(target_url_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid URL: {payload.target_url}")

    url_id = get_url_id(safe_url)
    headers = {
        "x-apikey": os.getenv("VT_KEY"),
    }
    if not headers["x-apikey"]:
        raise HTTPException(status_code=401, detail="Where is api key bro?")
    else:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://www.virustotal.com/api/v3/urls/{url_id}",
                    headers=headers
                )
                result = response.json()
                stats = result['data']['attributes']['last_analysis_stats']
                return {
                    "url": payload.target_url,
                    "malicious_votes": stats['malicious'],
                    "suspicious_votes": stats['suspicious'],
                    "is_safe": stats['malicious'] == 0
                }

        except HTTPException as http_exc:
            raise http_exc

        except Exception as e:
            await log_test(e, endpoint="/check_url")
            raise HTTPException(
                status_code=500,
                detail="Something went wrong on our side. The developer has been notified."
            )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
