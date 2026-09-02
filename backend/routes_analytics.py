from fastapi import APIRouter, Depends
from sqlalchemy import func, case, extract
from sqlalchemy.orm import Session
from database import get_db
from models import Invoice, Client, utcnow
from auth import get_current_user
from typing import Dict, List
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard_stats(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict:
    """Dashboard analytics: totals, recent invoices, monthly income."""
    now = utcnow()

    # Aggregate totals by status
    status_totals = (
        db.query(
            Invoice.status,
            func.count(Invoice.id).label("count"),
            func.coalesce(func.sum(Invoice.total), 0.0).label("total"),
        )
        .filter(Invoice.user_id == current_user.id)
        .group_by(Invoice.status)
        .all()
    )

    totals_by_status = {row.status: {"count": row.count, "total": row.total} for row in status_totals}

    # Derive overdue from sent invoices
    overdue_stats = (
        db.query(
            func.count(Invoice.id).label("count"),
            func.coalesce(func.sum(Invoice.total), 0.0).label("total"),
        )
        .filter(
            Invoice.user_id == current_user.id,
            Invoice.status == "sent",
            Invoice.due_date < now,
        )
        .first()
    )

    # Calculate earned (paid), outstanding (sent but not overdue), overdue
    paid_data = totals_by_status.get("paid", {"count": 0, "total": 0.0})
    sent_data = totals_by_status.get("sent", {"count": 0, "total": 0.0})

    outstanding_total = sent_data["total"] - overdue_stats.total
    outstanding_count = sent_data["count"] - overdue_stats.count

    # Recent invoices (last 5)
    recent = (
        db.query(Invoice)
        .filter(Invoice.user_id == current_user.id)
        .order_by(Invoice.issue_date.desc(), Invoice.id.desc())
        .limit(5)
        .all()
    )

    recent_invoices = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "client_name": inv.client.name if inv.client else "",
            "total": inv.total,
            "status": "overdue" if (inv.status == "sent" and inv.due_date < now) else inv.status,
            "issue_date": inv.issue_date.isoformat(),
        }
        for inv in recent
    ]

    # Monthly income (last 12 months)
    twelve_months_ago = now - timedelta(days=365)
    monthly_data = (
        db.query(
            extract("year", Invoice.issue_date).label("year"),
            extract("month", Invoice.issue_date).label("month"),
            func.coalesce(func.sum(Invoice.total), 0.0).label("total"),
        )
        .filter(
            Invoice.user_id == current_user.id,
            Invoice.status == "paid",
            Invoice.issue_date >= twelve_months_ago,
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    monthly_income = [
        {
            "month": f"{int(row.year)}-{int(row.month):02d}",
            "total": row.total,
        }
        for row in monthly_data
    ]

    # Client count
    client_count = db.query(func.count(Client.id)).filter(Client.user_id == current_user.id).scalar()

    return {
        "earned": paid_data["total"],
        "outstanding": max(outstanding_total, 0.0),
        "overdue": overdue_stats.total,
        "client_count": client_count,
        "recent_invoices": recent_invoices,
        "monthly_income": monthly_income,
    }
