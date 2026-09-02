from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Invoice, InvoiceLineItem, Client, User
from schemas import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from auth import get_current_user
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/invoices", tags=["invoices"])

def calc_totals(line_items: list, tax_rate: float = 0, discount: float = 0):
    subtotal = sum(item["quantity"] * item["rate"] for item in line_items)
    tax = subtotal * (tax_rate / 100) if tax_rate else 0
    total = subtotal + tax - discount
    return subtotal, tax, total

@router.post("", response_model=InvoiceResponse)
def create_invoice(invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == invoice_data.client_id, Client.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid client")

    invoice_number = f"INV-{current_user.id}-{datetime.utcnow().timestamp()}"
    line_items_data = [item.dict() for item in invoice_data.line_items]

    subtotal, tax_amount, total = calc_totals(line_items_data, invoice_data.tax_rate, invoice_data.discount)

    invoice = Invoice(
        user_id=current_user.id,
        client_id=invoice_data.client_id,
        invoice_number=invoice_number,
        issue_date=datetime.utcnow(),
        due_date=invoice_data.due_date,
        subtotal=subtotal,
        tax_rate=invoice_data.tax_rate,
        tax_amount=tax_amount,
        discount=invoice_data.discount,
        total=total,
        notes=invoice_data.notes,
        public_token=uuid.uuid4(),
    )
    db.add(invoice)
    db.flush()

    for item in invoice_data.line_items:
        line_item = InvoiceLineItem(
            invoice_id=invoice.id,
            description=item.description,
            quantity=item.quantity,
            rate=item.rate,
            amount=item.quantity * item.rate,
        )
        db.add(line_item)

    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
):
    query = db.query(Invoice).filter(Invoice.user_id == current_user.id)

    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if search:
        query = query.join(Client).filter(Client.name.ilike(f"%{search}%"))

    invoices = query.all()
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, invoice_data: InvoiceUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice_data.line_items:
        db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice_id).delete()
        line_items_data = [item.dict() for item in invoice_data.line_items]
        subtotal, tax_amount, total = calc_totals(line_items_data, invoice_data.tax_rate or invoice.tax_rate, invoice_data.discount or invoice.discount)
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = total

        for item in invoice_data.line_items:
            line_item = InvoiceLineItem(
                invoice_id=invoice_id,
                description=item.description,
                quantity=item.quantity,
                rate=item.rate,
                amount=item.quantity * item.rate,
            )
            db.add(line_item)

    for key, value in invoice_data.dict(exclude_unset=True, exclude={'line_items'}).items():
        setattr(invoice, key, value)

    db.commit()
    db.refresh(invoice)
    return invoice

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    db.delete(invoice)
    db.commit()
    return {"ok": True}

@router.get("/public/{token}", response_model=InvoiceResponse)
def get_public_invoice(token: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.public_token == token).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice
