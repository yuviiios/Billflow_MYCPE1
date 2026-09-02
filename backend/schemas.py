from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ClientCreate(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class ClientUpdate(ClientCreate):
    pass

class ClientResponse(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceLineItemCreate(BaseModel):
    description: str
    quantity: float
    rate: float

class InvoiceLineItemResponse(InvoiceLineItemCreate):
    id: int
    amount: float

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    client_id: int
    due_date: datetime
    line_items: List[InvoiceLineItemCreate]
    tax_rate: float = 0.0
    discount: float = 0.0
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    due_date: Optional[datetime] = None
    line_items: Optional[List[InvoiceLineItemCreate]] = None
    tax_rate: Optional[float] = None
    discount: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    status: str
    issue_date: datetime
    due_date: datetime
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount: float
    total: float
    notes: Optional[str]
    public_token: str
    line_items: List[InvoiceLineItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    currency: Optional[str] = None
    invoice_prefix: Optional[str] = None

class UserSettingsResponse(BaseModel):
    id: int
    business_name: str
    currency: str
    invoice_prefix: str
    logo_url: Optional[str]

    class Config:
        from_attributes = True
