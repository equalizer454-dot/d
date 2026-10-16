from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.dependencies import get_db
from backend.middleware.auth import get_current_user, require_role
from backend.schemas.alert import AlertCreate, AlertResponse, AlertStatusUpdate
from backend.services.alert_service import (
    create_alert,
    get_alert,
    get_alerts,
    update_alert_status,
)


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)


@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_alert(
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("ADMIN", "ANALYST")),
):
    return create_alert(db, alert_data)


# ============================================================
# GET ALL ALERTS
# ADMIN / ANALYST / VIEWER
# ============================================================

@router.get(
    "",
    response_model=list[AlertResponse],
)
def list_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return get_alerts(db)


# ============================================================
# GET ONE ALERT
# ADMIN / ANALYST / VIEWER
# ============================================================

@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
)
def read_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    alert = get_alert(
        db,
        alert_id,
    )

    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    return alert


# ============================================================
# UPDATE ALERT STATUS
# ADMIN / ANALYST
# ============================================================

@router.patch(
    "/{alert_id}",
    response_model=AlertResponse,
)
def change_alert_status(
    alert_id: UUID,
    status_data: AlertStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("ADMIN", "ANALYST")
    ),
):
    allowed_statuses = {
        "OPEN",
        "INVESTIGATING",
        "RESOLVED",
    }

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid alert status",
        )

    alert = update_alert_status(
        db,
        alert_id,
        status_data.status,
    )

    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    return alert
