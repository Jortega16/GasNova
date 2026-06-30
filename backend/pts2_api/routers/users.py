"""User and operator management router."""

from __future__ import annotations

import os
import uuid
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import CommandResponse, UserCreate, UserResponse, LoginRequest
from ..security import hash_pin, verify_pin

logger = logging.getLogger("pts2_api.routers.users")

router = APIRouter(prefix="/users", tags=["users"])


def seed_initial_users_if_empty(db: Session) -> None:
    """Prepopulate with default users if the table is empty.

    PINs are read from environment variables so they can be changed before
    deploying to production without touching source code.
    """
    if db.query(User).count() > 0:
        return

    admin_pin = os.getenv("SEED_ADMIN_PIN", "1234")
    manager_pin = os.getenv("SEED_MANAGER_PIN", "0000")
    supervisor_pin = os.getenv("SEED_SUPERVISOR_PIN", "5555")
    operator_pin = os.getenv("SEED_OPERATOR_PIN", "1111")

    initial_users = [
        User(
            id="U-01", name="Administrador GasNova", username="admin",
            role="Admin", avatar="🛡️",
            pin=hash_pin(admin_pin), status="Active",
        ),
        User(
            id="U-02", name="John Doe", username="jdoe",
            role="Manager", avatar="👨‍💼",
            pin=hash_pin(manager_pin), status="Active",
        ),
        User(
            id="U-03", name="Isabel Gómez", username="isabel",
            role="Supervisor", avatar="👩‍🔬",
            pin=hash_pin(supervisor_pin), status="Active",
        ),
        User(
            id="U-04", name="Carlos Ruiz", username="carlos",
            role="Operator", avatar="👨‍🔧",
            pin=hash_pin(operator_pin), status="Active",
        ),
    ]
    db.add_all(initial_users)
    db.commit()
    logger.info("Seeded %d initial users", len(initial_users))


@router.get("", response_model=CommandResponse, summary="List all operators")
def list_users(db: Session = Depends(get_db)) -> CommandResponse:
    """List all registered station operators."""
    users = db.query(User).all()
    serialized = [
        UserResponse(
            id=u.id,
            username=u.username,
            name=u.name,
            role=u.role,
            avatar=u.avatar,
            status=u.status,
        ).model_dump()
        for u in users
    ]
    return CommandResponse(data=serialized)


@router.post("", response_model=CommandResponse, summary="Create a new operator")
def create_user(
    request: UserCreate, db: Session = Depends(get_db)
) -> CommandResponse:
    """Create a new operator profile."""
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe",
        )

    new_id = f"U-{str(uuid.uuid4())[:8].upper()}"
    user = User(
        id=new_id,
        username=request.username,
        name=request.name,
        role=request.role,
        avatar=request.avatar,
        pin=hash_pin(request.pin),
        status=request.status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    res = UserResponse(
        id=user.id,
        username=user.username,
        name=user.name,
        role=user.role,
        avatar=user.avatar,
        status=user.status,
    )
    return CommandResponse(data=res.model_dump())


@router.delete("/{user_id}", response_model=CommandResponse, summary="Delete operator")
def delete_user(user_id: str, db: Session = Depends(get_db)) -> CommandResponse:
    """Delete an operator profile by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    db.delete(user)
    db.commit()
    return CommandResponse(data={"deleted": True, "id": user_id})


@router.post(
    "/login", response_model=CommandResponse, summary="Verify PIN authentication"
)
def verify_pin_endpoint(
    request: LoginRequest, db: Session = Depends(get_db)
) -> CommandResponse:
    """Verify operator PIN for relevo (shift handover) authentication."""
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if not verify_pin(request.pin, user.pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código PIN de acceso incorrecto",
        )

    res = UserResponse(
        id=user.id,
        username=user.username,
        name=user.name,
        role=user.role,
        avatar=user.avatar,
        status=user.status,
    )
    return CommandResponse(data=res.model_dump())
