"""User and operator management router."""

from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import CommandResponse, UserCreate, UserResponse, LoginRequest

router = APIRouter(prefix="/users", tags=["users"])


def seed_initial_users_if_empty(db: Session) -> None:
    """Prepopulate database with default users if empty."""
    if db.query(User).count() == 0:
        initial_users = [
            User(id="U-01", name="Administrador GasNova", username="admin", role="Admin", avatar="🛡️", pin="1234", status="Active"),
            User(id="U-02", name="John Doe", username="jdoe", role="Manager", avatar="👨‍💼", pin="0000", status="Active"),
            User(id="U-03", name="Isabel Gómez", username="isabel", role="Supervisor", avatar="👩‍🔬", pin="5555", status="Active"),
            User(id="U-04", name="Carlos Ruiz", username="carlos", role="Operator", avatar="👨‍🔧", pin="1111", status="Active"),
        ]
        db.add_all(initial_users)
        db.commit()


@router.get("", response_model=CommandResponse, summary="List all operators")
def list_users(db: Session = Depends(get_db)) -> CommandResponse:
    """Get the list of all registered station operators."""
    seed_initial_users_if_empty(db)
    users = db.query(User).all()
    serialized = [
        UserResponse(
            id=u.id,
            username=u.username,
            name=u.name,
            role=u.role,
            avatar=u.avatar,
            status=u.status
        ).model_dump()
        for u in users
    ]
    return CommandResponse(data=serialized)


@router.post("", response_model=CommandResponse, summary="Create a new operator")
def create_user(request: UserCreate, db: Session = Depends(get_db)) -> CommandResponse:
    """Create a new operator profile in the database."""
    # Check if username exists
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")

    new_id = f"U-{str(uuid.uuid4())[:8].upper()}"
    user = User(
        id=new_id,
        username=request.username,
        name=request.name,
        role=request.role,
        avatar=request.avatar,
        pin=request.pin,
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
        status=user.status
    )
    return CommandResponse(data=res.model_dump())


@router.delete("/{user_id}", response_model=CommandResponse, summary="Delete operator")
def delete_user(user_id: str, db: Session = Depends(get_db)) -> CommandResponse:
    """Delete an operator profile from the database by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user)
    db.commit()
    return CommandResponse(data={"deleted": True, "id": user_id})


@router.post("/login", response_model=CommandResponse, summary="Verify PIN authentication")
def verify_pin(request: LoginRequest, db: Session = Depends(get_db)) -> CommandResponse:
    """Verify operator PIN passcode for relevo authentication."""
    seed_initial_users_if_empty(db)
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user.pin != request.pin:
        raise HTTPException(status_code=401, detail="Código PIN de acceso incorrecto")
    
    res = UserResponse(
        id=user.id,
        username=user.username,
        name=user.name,
        role=user.role,
        avatar=user.avatar,
        status=user.status
    )
    return CommandResponse(data=res.model_dump())
