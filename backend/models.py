from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import uuid


def utcnow() -> datetime:
    """Naive UTC timestamp, matching the timezone-naive DateTime columns below."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    settings = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    clients = relationship("Client", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_settings_user_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_name = Column(String, default="My Business", nullable=False)
    business_email = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    business_phone = Column(String, nullable=True)
    tax_rate = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    payment_terms = Column(Text, nullable=True)
    invoice_prefix = Column(String, default="INV", nullable=False)
    logo_url = Column(String, nullable=True)

    user = relationship("User", back_populates="settings")


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    company = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client")


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "invoice_number", name="uq_invoices_user_invoice_number"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), index=True, nullable=False)
    invoice_number = Column(String, index=True, nullable=False)
    status = Column(String, default="draft", nullable=False)
    issue_date = Column(DateTime, default=utcnow, nullable=False)
    due_date = Column(DateTime, nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    public_token = Column(
        String(36),
        default=lambda: str(uuid.uuid4()),
        unique=True,
        index=True,
        nullable=False,
    )
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")
    line_items = relationship(
        "InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan"
    )


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), index=True, nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="line_items")
