from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload
from database import get_db
from models import Invoice, InvoiceLineItem, Client, User, UserSettings, utcnow
from schemas import (
    FILTERABLE_STATUSES,
    InvoiceCreate,
    InvoiceLineItemResponse,
    InvoiceResponse,
    InvoiceUpdate,
)
from auth import get_current_user
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/invoices", tags=["invoices"])


def recalculate(invoice: Invoice) -> None:
    """Recompute line amounts and invoice totals from the current line items.

    Single source of truth for money: client-supplied amounts are never trusted.
    """
    for item in invoice.line_items:
        item.amount = round((item.quantity or 0.0) * (item.unit_price or 0.0), 2)

    invoice.subtotal = round(sum(item.amount for item in invoice.line_items), 2)
    invoice.tax_amount = round(invoice.subtotal * ((invoice.tax_rate or 0.0) / 100.0), 2)
    invoice.total = max(
        round(invoice.subtotal + invoice.tax_amount - (invoice.discount or 0.0), 2), 0.0
    )


def is_overdue(invoice: Invoice, now: datetime) -> bool:
    """Only issued-but-unpaid invoices go overdue; drafts and paid ones never do."""
    return invoice.status == "sent" and invoice.due_date is not None and invoice.due_date < now


def serialize_invoice(invoice: Invoice, now: Optional[datetime] = None) -> InvoiceResponse:
    now = now or utcnow()
    client = invoice.client
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        client_id=invoice.client_id,
        client_name=client.name if client else "",
        client_email=client.email if client else "",
        client_address=client.address if client else None,
        status="overdue" if is_overdue(invoice, now) else invoice.status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax=invoice.tax_amount,
        discount=invoice.discount,
        total=invoice.total,
        notes=invoice.notes,
        public_token=str(invoice.public_token),
        line_items=[
            InvoiceLineItemResponse.model_validate(item) for item in invoice.line_items
        ],
    )


def owned_client_or_400(db: Session, user: User, client_id: int) -> Client:
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == user.id)
        .first()
    )
    if not client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid client"
        )
    return client


def assert_number_unused(
    db: Session, user: User, invoice_number: str, exclude_id: Optional[int] = None
) -> None:
    query = db.query(Invoice.id).filter(
        Invoice.user_id == user.id, Invoice.invoice_number == invoice_number
    )
    if exclude_id is not None:
        query = query.filter(Invoice.id != exclude_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice number already in use",
        )


def load_invoice(db: Session, user: User, invoice_id: int) -> Invoice:
    invoice = (
        db.query(Invoice)
        .options(joinedload(Invoice.client), selectinload(Invoice.line_items))
        .filter(Invoice.id == invoice_id, Invoice.user_id == user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found"
        )
    return invoice


@router.post("", response_model=InvoiceResponse)
def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = owned_client_or_400(db, current_user, invoice_data.client_id)
    assert_number_unused(db, current_user, invoice_data.invoice_number)

    if invoice_data.tax_rate is not None:
        tax_rate = invoice_data.tax_rate
    else:
        settings = (
            db.query(UserSettings)
            .filter(UserSettings.user_id == current_user.id)
            .first()
        )
        tax_rate = settings.tax_rate if settings else 0.0

    invoice = Invoice(
        user_id=current_user.id,
        client_id=client.id,
        invoice_number=invoice_data.invoice_number,
        status="draft",
        issue_date=invoice_data.issue_date,
        due_date=invoice_data.due_date,
        tax_rate=tax_rate,
        discount=invoice_data.discount,
        notes=invoice_data.notes,
        line_items=[
            InvoiceLineItem(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                amount=0.0,
            )
            for item in invoice_data.line_items
        ],
    )
    recalculate(invoice)

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
    client_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
):
    now = utcnow()

    query = (
        db.query(Invoice)
        .join(Invoice.client)
        .options(joinedload(Invoice.client), selectinload(Invoice.line_items))
        .filter(Invoice.user_id == current_user.id)
    )

    status_filter = (status_filter or "").strip()
    if status_filter:
        if status_filter not in FILTERABLE_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"status must be one of {', '.join(FILTERABLE_STATUSES)}",
            )
        # "overdue" is derived, so translate it into its underlying condition and
        # keep "sent" meaning "sent and not yet overdue" for consistent counts.
        if status_filter == "overdue":
            query = query.filter(Invoice.status == "sent", Invoice.due_date < now)
        elif status_filter == "sent":
            query = query.filter(Invoice.status == "sent", Invoice.due_date >= now)
        else:
            query = query.filter(Invoice.status == status_filter)

    if client_id is not None:
        query = query.filter(Invoice.client_id == client_id)

    search = (search or "").strip()
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Invoice.invoice_number.ilike(term),
                Client.name.ilike(term),
                Client.company.ilike(term),
            )
        )

    invoices = query.order_by(Invoice.issue_date.desc(), Invoice.id.desc()).all()
    return [serialize_invoice(invoice, now) for invoice in invoices]


# Must be declared before "/{invoice_id}", otherwise "public" is parsed as an id.
@router.get("/public/{token}", response_model=InvoiceResponse)
def get_public_invoice(token: str, db: Session = Depends(get_db)):
    invoice = (
        db.query(Invoice)
        .options(joinedload(Invoice.client), selectinload(Invoice.line_items))
        .filter(Invoice.public_token == token)
        .first()
    )
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found"
        )
    return serialize_invoice(invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return serialize_invoice(load_invoice(db, current_user, invoice_id))


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = load_invoice(db, current_user, invoice_id)
    payload = invoice_data.model_dump(exclude_unset=True)

    if "client_id" in payload:
        owned_client_or_400(db, current_user, payload["client_id"])
    if "invoice_number" in payload:
        assert_number_unused(
            db, current_user, payload["invoice_number"], exclude_id=invoice.id
        )

    issue_date = payload.get("issue_date", invoice.issue_date)
    due_date = payload.get("due_date", invoice.due_date)
    if due_date < issue_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="due_date must not be earlier than issue_date",
        )

    line_items = payload.pop("line_items", None)
    for key, value in payload.items():
        setattr(invoice, key, value)

    if line_items is not None:
        # Reassigning the collection lets delete-orphan clean up the old rows.
        invoice.line_items = [
            InvoiceLineItem(
                description=item["description"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                amount=0.0,
            )
            for item in line_items
        ]

    # Always recompute: tax_rate/discount changes affect totals even with no new lines.
    recalculate(invoice)

    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoice = load_invoice(db, current_user, invoice_id)
    db.delete(invoice)
    db.commit()
    return {"ok": True}
