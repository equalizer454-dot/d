from backend.database.base import Base
from backend.database.postgres import engine
from backend.models.user import User
from backend.models.event import Event
from backend.models.alert import Alert
from backend.models.incident import Incident
from backend.models.incident_action import IncidentAction
from backend.models.investigation_note import InvestigationNote


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")
