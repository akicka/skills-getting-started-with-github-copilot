import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

pytestmark = pytest.mark.api


@pytest.fixture(autouse=True)
def reset_activities():
    """Keep tests isolated by restoring participants after each test."""
    original_participants = {
        name: list(data["participants"]) for name, data in activities.items()
    }
    yield
    for name, participants in original_participants.items():
        activities[name]["participants"] = participants


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.smoke
def test_get_activities_returns_all_activities(client):
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, dict)
    assert "Chess Club" in payload


def test_get_activities_contains_required_fields(client):
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    payload = response.json()
    sample = payload["Chess Club"]
    assert "description" in sample
    assert "schedule" in sample
    assert "max_participants" in sample
    assert "participants" in sample


@pytest.mark.smoke
def test_signup_adds_new_participant(client):
    # Arrange
    activity_name = "Chess Club"
    email = "new.student@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    updated = client.get("/activities").json()
    assert email in updated[activity_name]["participants"]


def test_signup_duplicate_participant_returns_400(client):
    # Arrange
    activity_name = "Chess Club"
    email = "duplicate@mergington.edu"
    client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_nonexistent_activity_returns_404(client):
    # Arrange

    # Act
    response = client.post("/activities/Unknown Activity/signup", params={"email": "a@b.com"})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


@pytest.mark.smoke
def test_unregister_removes_existing_participant(client):
    # Arrange
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    updated = client.get("/activities").json()
    assert email not in updated[activity_name]["participants"]


def test_unregister_unknown_participant_returns_404(client):
    # Arrange

    # Act
    response = client.delete(
        "/activities/Chess Club/participants",
        params={"email": "missing@mergington.edu"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"


def test_unregister_nonexistent_activity_returns_404(client):
    # Arrange

    # Act
    response = client.delete(
        "/activities/Unknown Activity/participants",
        params={"email": "missing@mergington.edu"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


@pytest.mark.smoke
def test_root_redirects_to_static_index(client):
    # Arrange

    # Act
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code in (301, 302, 307, 308)
    assert response.headers["location"].endswith("/static/index.html")
