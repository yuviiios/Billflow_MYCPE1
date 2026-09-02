from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes_auth import router as auth_router
from routes_clients import router as clients_router
from routes_invoices import router as invoices_router
from routes_settings import router as settings_router
from routes_analytics import router as analytics_router

load_dotenv()

app = FastAPI(title="BillFlow API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schema is owned by Alembic (`alembic upgrade head`) or `python init_db.py` for a
# throwaway local DB. Creating tables on import silently diverges from migrations.
app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(invoices_router)
app.include_router(settings_router)
app.include_router(analytics_router)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
