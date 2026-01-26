from fastapi import HTTPException
from urllib.parse import urlparse

def validate_url(target_url: str):
    parsed = urlparse(target_url)
    if parsed.scheme not in ["http", "https"]:
        raise HTTPException(status_code=400, detail="Invalid URL scheme")

    blocked_hosts = ["127.0.0.1", "localhost", "0.0.0.0"]
    if parsed.hostname in blocked_hosts:
        raise HTTPException(status_code=400, detail="URL points to local network")

    return target_url