from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Client, Invoice, User
from schemas import ClientCreate, ClientUpdate, ClientResponse
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/clients", tags=["clients"])


def load_client(db: Session, user: User, client_id: int) -> Client:
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == user.id)
        .first()
    )
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    return client


@router.post("", response_model=ClientResponse)
def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = Client(**client_data.model_dump(), user_id=current_user.id)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("", response_model=List[ClientResponse])
def list_clients(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return (
        db.query(Client)
        .filter(Client.user_id == current_user.id)
        .order_by(Client.name.asc(), Client.id.asc())
        .all()
    )


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return load_client(db, current_user, client_id)


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client_data: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = load_client(db, current_user, client_id)

    for key, value in client_data.model_dump(exclude_unset=True).items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = load_client(db, current_user, client_id)

    # Invoices reference the client, so refuse rather than orphan them or hit a
    # foreign-key error at flush time.
    invoice_count = (
        db.query(Invoice.id).filter(Invoice.client_id == client.id).count()
    )
    if invoice_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client has {invoice_count} invoice(s); delete those first",
        )

    db.delete(client)
    db.commit()
    return {"ok": True}
