"""Seed database with demo data for BillFlow

Creates:
- Demo user: demo@billflow.app / demo123
- 3 sample clients
- 8 invoices (mix of draft, sent, paid, overdue)
- One public invoice with known token for README
"""
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import SessionLocal, engine, Base
from models import User, UserSettings, Client, Invoice, InvoiceLineItem

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Known public token for demo invoice
DEMO_PUBLIC_TOKEN = "550e8400-e29b-41d4-a716-446655440000"


def clear_db():
    """Drop all tables and recreate"""
    print("Clearing database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database cleared and recreated")


def create_demo_user(db: Session) -> User:
    """Create demo user with settings"""
    print("Creating demo user...")

    hashed = pwd_context.hash("demo123")
    user = User(
        email="demo@billflow.app",
        hashed_password=hashed,
    )
    db.add(user)
    db.flush()

    settings = UserSettings(
        user_id=user.id,
        business_name="BillFlow Demo",
        business_email="billing@billflow.app",
        business_address="123 Demo Street, San Francisco, CA 94103",
        business_phone="+1 (555) 123-4567",
        tax_rate=8.5,
        currency="USD",
        payment_terms="Net 30. Payment due within 30 days of invoice date.",
        invoice_prefix="BF",
    )
    db.add(settings)
    print(f"Created user: {user.email}")
    return user


def create_clients(db: Session, user_id: int) -> list[Client]:
    """Create 3 sample clients"""
    print("Creating clients...")

    clients_data = [
        {
            "name": "Acme Corporation",
            "email": "accounting@acme.corp",
            "company": "Acme Corporation",
            "address": "456 Business Blvd, New York, NY 10001",
            "phone": "+1 (555) 234-5678",
        },
        {
            "name": "TechStart Inc",
            "email": "finance@techstart.io",
            "company": "TechStart Inc",
            "address": "789 Startup Lane, Austin, TX 78701",
            "phone": "+1 (555) 345-6789",
        },
        {
            "name": "Global Ventures",
            "email": "ap@globalventures.com",
            "company": "Global Ventures LLC",
            "address": "321 Enterprise Way, Boston, MA 02101",
            "phone": "+1 (555) 456-7890",
        },
    ]

    clients = []
    for data in clients_data:
        client = Client(user_id=user_id, **data)
        db.add(client)
        clients.append(client)

    db.flush()
    print(f"Created {len(clients)} clients")
    return clients


def create_invoices(db: Session, user_id: int, clients: list[Client]) -> list[Invoice]:
    """Create 8 sample invoices with various statuses"""
    print("Creating invoices...")

    now = datetime.utcnow()

    invoices_data = [
        # Public demo invoice (sent, due in 2 weeks)
        {
            "client": clients[0],
            "invoice_number": "BF-2024-001",
            "status": "sent",
            "issue_date": now - timedelta(days=2),
            "due_date": now + timedelta(days=12),
            "notes": "Public demo invoice - Web design services for Q4 2024",
            "public_token": DEMO_PUBLIC_TOKEN,
            "items": [
                {"description": "Homepage Redesign", "quantity": 1, "unit_price": 2500.00},
                {"description": "Mobile Optimization", "quantity": 1, "unit_price": 1500.00},
                {"description": "SEO Consultation", "quantity": 4, "unit_price": 300.00},
            ],
        },
        # Paid invoice
        {
            "client": clients[0],
            "invoice_number": "BF-2024-002",
            "status": "paid",
            "issue_date": now - timedelta(days=45),
            "due_date": now - timedelta(days=15),
            "notes": "Logo design and brand identity",
            "items": [
                {"description": "Logo Design Concepts", "quantity": 3, "unit_price": 500.00},
                {"description": "Brand Guidelines", "quantity": 1, "unit_price": 800.00},
            ],
        },
        # Overdue invoice
        {
            "client": clients[1],
            "invoice_number": "BF-2024-003",
            "status": "sent",
            "issue_date": now - timedelta(days=50),
            "due_date": now - timedelta(days=20),
            "notes": "Backend API development",
            "items": [
                {"description": "REST API Development", "quantity": 40, "unit_price": 150.00},
                {"description": "Database Schema Design", "quantity": 8, "unit_price": 150.00},
            ],
        },
        # Draft invoice
        {
            "client": clients[1],
            "invoice_number": "BF-2024-004",
            "status": "draft",
            "issue_date": now,
            "due_date": now + timedelta(days=30),
            "notes": "Monthly retainer - December 2024",
            "items": [
                {"description": "Development Hours", "quantity": 80, "unit_price": 125.00},
            ],
        },
        # Sent invoice (due soon)
        {
            "client": clients[2],
            "invoice_number": "BF-2024-005",
            "status": "sent",
            "issue_date": now - timedelta(days=25),
            "due_date": now + timedelta(days=5),
            "notes": "UI/UX consulting services",
            "items": [
                {"description": "User Research", "quantity": 16, "unit_price": 175.00},
                {"description": "Wireframe Design", "quantity": 12, "unit_price": 150.00},
            ],
        },
        # Paid invoice
        {
            "client": clients[2],
            "invoice_number": "BF-2024-006",
            "status": "paid",
            "issue_date": now - timedelta(days=60),
            "due_date": now - timedelta(days=30),
            "notes": "Frontend implementation",
            "items": [
                {"description": "React Components", "quantity": 30, "unit_price": 140.00},
                {"description": "Testing & QA", "quantity": 10, "unit_price": 120.00},
            ],
        },
        # Draft invoice
        {
            "client": clients[0],
            "invoice_number": "BF-2024-007",
            "status": "draft",
            "issue_date": now,
            "due_date": now + timedelta(days=30),
            "notes": "Maintenance and support - January 2025",
            "items": [
                {"description": "Monthly Maintenance", "quantity": 1, "unit_price": 1200.00},
                {"description": "Priority Support", "quantity": 1, "unit_price": 500.00},
            ],
        },
        # Sent invoice (recent)
        {
            "client": clients[1],
            "invoice_number": "BF-2024-008",
            "status": "sent",
            "issue_date": now - timedelta(days=5),
            "due_date": now + timedelta(days=25),
            "notes": "DevOps consulting",
            "items": [
                {"description": "CI/CD Pipeline Setup", "quantity": 1, "unit_price": 2000.00},
                {"description": "Infrastructure Review", "quantity": 8, "unit_price": 200.00},
            ],
        },
    ]

    invoices = []
    for inv_data in invoices_data:
        items_data = inv_data.pop("items")
        client = inv_data.pop("client")

        # Calculate totals
        subtotal = sum(item["quantity"] * item["unit_price"] for item in items_data)
        tax_rate = 8.5
        tax_amount = subtotal * (tax_rate / 100)
        total = subtotal + tax_amount

        invoice = Invoice(
            user_id=user_id,
            client_id=client.id,
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total=total,
            **inv_data,
        )
        db.add(invoice)
        db.flush()

        # Add line items
        for item_data in items_data:
            amount = item_data["quantity"] * item_data["unit_price"]
            line_item = InvoiceLineItem(
                invoice_id=invoice.id,
                amount=amount,
                **item_data,
            )
            db.add(line_item)

        invoices.append(invoice)

    db.flush()
    print(f"Created {len(invoices)} invoices")
    return invoices


def seed():
    """Run full seed process"""
    db = SessionLocal()
    try:
        clear_db()

        user = create_demo_user(db)
        clients = create_clients(db, user.id)
        invoices = create_invoices(db, user.id, clients)

        db.commit()

        print("\n" + "="*60)
        print("✓ Database seeded successfully!")
        print("="*60)
        print(f"\nDemo Login:")
        print(f"  Email:    demo@billflow.app")
        print(f"  Password: demo123")
        print(f"\nCreated:")
        print(f"  - {len(clients)} clients")
        print(f"  - {len(invoices)} invoices")
        print(f"\nPublic Invoice:")
        print(f"  Token: {DEMO_PUBLIC_TOKEN}")
        print(f"  URL:   http://localhost:3000/invoice/{DEMO_PUBLIC_TOKEN}")
        print("="*60)

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
