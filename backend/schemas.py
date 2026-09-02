from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from typing import List, Literal, Optional
from datetime import datetime

# "overdue" is derived from due_date at serialization time, never stored or set directly.
InvoiceStatus = Literal["draft", "sent", "paid", "overdue"]
SettableInvoiceStatus = Literal["draft", "sent", "paid"]
FILTERABLE_STATUSES = ("draft", "sent", "paid", "overdue")


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    company: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class ClientUpdate(BaseModel):
    """All fields optional so PUT can send a partial payload."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    company: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime


class InvoiceLineItemCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)
    quantity: float = Field(ge=0)
    unit_price: float = Field(ge=0)


class InvoiceLineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    quantity: float
    unit_price: float
    amount: float


class InvoiceCreate(BaseModel):
    client_id: int
    invoice_number: str = Field(min_length=1, max_length=64)
    issue_date: datetime
    due_date: datetime
    line_items: List[InvoiceLineItemCreate] = Field(min_length=1)
    # Omit tax_rate to inherit the rate from the user's settings.
    tax_rate: Optional[float] = Field(default=None, ge=0, le=100)
    discount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None

    @field_validator("invoice_number")
    @classmethod
    def strip_invoice_number(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("invoice_number must not be blank")
        return value

    @model_validator(mode="after")
    def check_dates(self) -> "InvoiceCreate":
        if self.due_date < self.issue_date:
            raise ValueError("due_date must not be earlier than issue_date")
        return self


class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    invoice_number: Optional[str] = Field(default=None, min_length=1, max_length=64)
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    line_items: Optional[List[InvoiceLineItemCreate]] = Field(default=None, min_length=1)
    tax_rate: Optional[float] = Field(default=None, ge=0, le=100)
    discount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None
    status: Optional[SettableInvoiceStatus] = None

    @field_validator("invoice_number")
    @classmethod
    def strip_invoice_number(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("invoice_number must not be blank")
        return value


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    client_name: str
    client_email: str
    client_address: Optional[str] = None
    status: InvoiceStatus
    issue_date: datetime
    due_date: datetime
    subtotal: float
    tax_rate: float
    tax: float
    discount: float
    total: float
    notes: Optional[str] = None
    public_token: str
    line_items: List[InvoiceLineItemResponse]


class UserSettingsUpdate(BaseModel):
    business_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    business_email: Optional[EmailStr] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    tax_rate: Optional[float] = Field(default=None, ge=0, le=100)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    payment_terms: Optional[str] = None
    invoice_prefix: Optional[str] = Field(default=None, min_length=1, max_length=16)

    @field_validator("business_email", mode="before")
    @classmethod
    def blank_email_to_none(cls, value):
        """A cleared form field arrives as "", which is not a valid EmailStr."""
        if isinstance(value, str) and not value.strip():
            return None
        return value


class UserSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    business_email: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    tax_rate: float
    currency: str
    payment_terms: Optional[str] = None
    invoice_prefix: str
    logo_url: Optional[str] = None
