from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.dependencies import get_db
from backend.middleware.auth import get_current_user, require_role
from backend.schemas.event import EventCreate, EventResponse
from backend.services.detection_service import (
    detect_success_after_failures,
    detect_suspicious_ip_activity,
    detect_privilege_escalation,
    detect_unusual_login_behavior,
    detect_repeated_host_activity,
)
from backend.services.detection_integration_service import detect_event
from backend.services.event_service import (
    create_event,
    get_event,
    get_events,
)
from backend.services.incident_automation_service import (
    create_incident_from_alert,
)


router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


# ============================================================
# CREATE EVENT
# ADMIN or ANALYST
# ============================================================

@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("ADMIN", "ANALYST")
    ),
):
    event = create_event(
        db,
        event_data,
    )

    # ========================================================
    # RUN DETECTION RULES
    # ========================================================

    detected_alerts = detect_event(db, event)

    alert = detect_success_after_failures(
        db,
        event,
    )

    if alert:
        detected_alerts.append(alert)

    alert = detect_suspicious_ip_activity(
        db,
        event,
    )

    if alert:
        detected_alerts.append(alert)

    alert = detect_privilege_escalation(
        db,
        event,
    )

    if alert:
        detected_alerts.append(alert)

    alert = detect_unusual_login_behavior(
        db,
        event,
    )

    if alert:
        detected_alerts.append(alert)

    alert = detect_repeated_host_activity(
        db,
        event,
    )

    if alert:
        detected_alerts.append(alert)

    # ========================================================
    # AUTOMATIC INCIDENT CREATION
    # ========================================================

    for alert in detected_alerts:
        create_incident_from_alert(
            db,
            alert,
        )

    return event


# ============================================================
# GET ALL EVENTS
# ADMIN / ANALYST / VIEWER
# ============================================================

@router.get(
    "",
    response_model=list[EventResponse],
)
def list_events(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return get_events(db)


# ============================================================
# GET ONE EVENT
# ADMIN / ANALYST / VIEWER
# ============================================================

@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
def read_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    event = get_event(
        db,
        event_id,
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return event
