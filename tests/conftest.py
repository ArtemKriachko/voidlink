import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
import os
import pytest_asyncio

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def override_get_db():
    db = None
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        if db is not None:
            db.close()

app.dependency_overrides[get_db] = override_get_db

# У файлі tests/conftest.py
@pytest_asyncio.fixture
async def ac():
    transport = ASGITransport(app=app) # type: ignore
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client