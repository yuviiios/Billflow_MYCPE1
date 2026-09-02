from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UUID
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    settings = relationship("UserSettings", back_populates="user", uselist=False)
    clients = relationship("Client", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    business_name = Column(String, default="My Business")
    currency = Column(String, default="USD")
    invoice_prefix = Column(String, default="INV")
    logo_url = Column(String, nullable=True)

    user = relationship("User", back_populates="settings")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    email = Column(String)
    company = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    invoice_number = Column(String, index=True)
    status = Column(String, default="draft")
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    subtotal = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    public_token = Column(UUID, default=uuid.uuid4, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Float)
    rate = Column(Float)
    amount = Column(Float)

    invoice = relationship("Invoice", back_populates="line_items")
