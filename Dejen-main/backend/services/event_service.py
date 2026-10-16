from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.event import Event
from backend.schemas.event import EventCreate


def create_event(db: Session, event_data: EventCreate) -> Event:
    event = Event(
        agent_id=event_data.agent_id,
        host=event_data.host,
        event_type=event_data.event_type,
        username=event_data.username,
        source_ip=str(event_data.source_ip) if event_data.source_ip else None,
        message=event_data.message,
        severity=event_data.severity,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


def get_events(db: Session) -> list[Event]:
    statement = select(Event).order_by(Event.timestamp.desc())
    return list(db.scalars(statement).all())


def get_event(db: Session, event_id):
    statement = select(Event).where(Event.event_id == event_id)
    return db.scalar(statement)
