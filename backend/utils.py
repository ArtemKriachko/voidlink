from fastapi import HTTPException
from urllib.parse import urlparse
import base64


def validate_url(target_url: str):
    parsed = urlparse(target_url)
    if parsed.scheme not in ["http", "https"]:
        raise HTTPException(status_code=400, detail="Invalid URL scheme")

    blocked_hosts = ["127.0.0.1", "localhost", "0.0.0.0"]
    if parsed.hostname in blocked_hosts:
        raise HTTPException(status_code=400, detail="URL points to local network")

    return target_url


def get_url_id(target_url: str):
    url_bytes = target_url.encode("utf-8")
    base64_bytes = base64.b64encode(url_bytes)
    base64_url = base64_bytes.decode("utf-8")

    return base64_url.strip("=")