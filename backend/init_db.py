"""Initialize database - create all tables"""
from database import engine, Base
from models import User, UserSettings, Client, Invoice, InvoiceLineItem

def init_db():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

if __name__ == "__main__":
    init_db()
