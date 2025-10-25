import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import Base
from app.main import create_app
from app.core.config import get_settings

# Test database URL
TEST_DATABASE_URL = "postgresql://hulbert:hulbert_password@localhost:5432/hulbert_test_db"

@pytest.fixture(scope="session")
def test_db():
    """Create test database session"""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def client(test_db):
    """Create test client"""
    app = create_app()
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    """Get authentication headers for tests"""
    # Create a test user and get token
    response = client.post("/api/auth/login", json={
        "username": "test@example.com",
        "password": "testpassword"
    })
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}

@pytest.fixture
def sample_user_data():
    """Sample user data for tests"""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword",
        "first_name": "Test",
        "last_name": "User"
    }

@pytest.fixture
def sample_company_data():
    """Sample company data for tests"""
    return {
        "name": "Test Company",
        "address": "123 Test Street",
        "city": "Test City",
        "postal_code": "12345",
        "phone": "+33123456789",
        "email": "contact@testcompany.com"
    }

@pytest.fixture
def sample_project_data():
    """Sample project data for tests"""
    return {
        "name": "Test Project",
        "description": "A test project",
        "status": "active",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "budget": 10000.0
    }

@pytest.fixture
def sample_ticket_data():
    """Sample ticket data for tests"""
    return {
        "title": "Test Ticket",
        "description": "A test ticket",
        "priority": "medium",
        "status": "open",
        "category": "bug"
    }

@pytest.fixture
def sample_accounting_entry_data():
    """Sample accounting entry data for tests"""
    return {
        "date": "2025-01-01",
        "description": "Test accounting entry",
        "amount": 1000.0,
        "account_id": 1,
        "entry_type": "debit"
    }
