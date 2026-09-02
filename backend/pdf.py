from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime
from typing import Optional
import base64


def generate_invoice_pdf(
    invoice_number: str,
    client_name: str,
    client_email: str,
    client_address: Optional[str],
    issue_date: datetime,
    due_date: datetime,
    line_items: list,
    subtotal: float,
    tax: float,
    total: float,
    notes: Optional[str] = None,
    business_name: str = "My Business",
    business_address: Optional[str] = None,
    status: str = "draft",
    logo_url: Optional[str] = None,
) -> BytesIO:
    """
    Generate a PDF invoice using ReportLab.

    Returns a BytesIO buffer containing the PDF data.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch)
    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.black,
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "Heading",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.grey,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )
    right_align_style = ParagraphStyle(
        "RightAlign", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=10
    )

    # Logo and Header
    if logo_url and logo_url.startswith("data:image"):
        try:
            # Extract base64 data from data URL
            base64_data = logo_url.split(",")[1]
            logo_bytes = BytesIO(base64.b64decode(base64_data))
            logo_img = Image(logo_bytes, width=1.5 * inch, height=0.75 * inch)
            logo_img.hAlign = "LEFT"
            elements.append(logo_img)
            elements.append(Spacer(1, 0.2 * inch))
        except Exception:
            pass  # Skip logo if invalid

    # Header
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Paragraph(invoice_number, subtitle_style))

    # Business and client info in a table
    info_data = [
        [
            Paragraph("<b>From:</b>", styles["Normal"]),
            Paragraph("<b>Bill To:</b>", styles["Normal"]),
        ],
        [
            Paragraph(
                f"{business_name}<br/>{business_address or ''}", styles["Normal"]
            ),
            Paragraph(
                f"{client_name}<br/>{client_email}<br/>{client_address or ''}",
                styles["Normal"],
            ),
        ],
        [Paragraph("&nbsp;", styles["Normal"]), Paragraph("&nbsp;", styles["Normal"])],
        [
            Paragraph("&nbsp;", styles["Normal"]),
            Paragraph(
                f"<b>Issue Date:</b> {issue_date.strftime('%B %d, %Y')}<br/>"
                f"<b>Due Date:</b> {due_date.strftime('%B %d, %Y')}",
                styles["Normal"],
            ),
        ],
    ]

    info_table = Table(info_data, colWidths=[3.5 * inch, 3.5 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(info_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Line items table
    line_items_data = [["Description", "Qty", "Rate", "Amount"]]
    for item in line_items:
        line_items_data.append(
            [
                item["description"],
                str(item["quantity"]),
                f"${item['unit_price']:.2f}",
                f"${item['amount']:.2f}",
            ]
        )

    line_items_table = Table(
        line_items_data, colWidths=[3.5 * inch, 1 * inch, 1.25 * inch, 1.25 * inch]
    )
    line_items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.black),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 1), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ]
        )
    )
    elements.append(line_items_table)
    elements.append(Spacer(1, 0.2 * inch))

    # Totals table (right-aligned)
    totals_data = [
        ["Subtotal:", f"${subtotal:.2f}"],
        ["Tax:", f"${tax:.2f}"],
        ["<b>Total:</b>", f"<b>${total:.2f}</b>"],
    ]

    totals_table = Table(totals_data, colWidths=[1.5 * inch, 1.5 * inch])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("LINEABOVE", (0, 2), (-1, 2), 1, colors.black),
                ("TOPPADDING", (0, 2), (-1, 2), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("FONTSIZE", (0, 2), (-1, 2), 12),
            ]
        )
    )

    # Wrap totals in a container table to right-align
    totals_container = Table([[totals_table]], colWidths=[7 * inch])
    totals_container.setStyle(
        TableStyle([("ALIGN", (0, 0), (-1, -1), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "TOP")])
    )
    elements.append(totals_container)

    # Notes
    if notes:
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("<b>Notes:</b>", heading_style))
        elements.append(Paragraph(notes, styles["Normal"]))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
