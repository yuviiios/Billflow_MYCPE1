# BillFlow

Modern invoice management system built with FastAPI and Next.js.

## Features

- 📊 **Dashboard** - Overview of invoices, revenue, and analytics
- 👥 **Client Management** - Track and manage your clients
- 🧾 **Invoice Creation** - Create, edit, and send professional invoices
- 📧 **Email Distribution** - Send invoices via email with PDF attachments
- 🔗 **Public Invoice Links** - Share payment-ready invoices with unique URLs
- 💰 **Payment Tracking** - Monitor paid, sent, draft, and overdue invoices
- 📈 **Analytics** - Revenue trends and financial insights
- ⚙️ **Business Settings** - Customize your business info, tax rates, and branding

## Demo

**Backend API:** https://billflow-mycpe1.onrender.com
**Frontend:** [Deploying to Vercel]

### Demo Login

**Email:** `demo@billflow.app`  
**Password:** `demo123`


**API Endpoints:**
- Swagger UI: https://billflow-mycpe1.onrender.com/docs
- ReDoc: https://billflow-mycpe1.onrender.com/redoc

## Tech Stack

**Backend:**
- FastAPI
- PostgreSQL + SQLAlchemy
- Pydantic for validation
- JWT authentication
- ReportLab for PDF generation
- Resend/SMTP for email delivery

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for analytics

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. **Clone and navigate:**
   ```bash
   git clone <your-repo-url>
   cd MYCPE_One/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/billflow
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=http://localhost:3000
   
   # Email (choose one)
   RESEND_API_KEY=re_your_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

5. **Initialize database:**
   ```bash
   python init_db.py
   ```

6. **Seed demo data:**
   ```bash
   python seed.py
   ```

7. **Run backend:**
   ```bash
   uvicorn main:app --reload
   ```
   Backend runs at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run frontend:**
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:3000`

## Usage

1. **Login** with demo credentials or create a new account
2. **Add clients** in the Clients page
3. **Create invoices** with line items, tax rates, and payment terms
4. **Send invoices** via email or share public links
5. **Track payments** and view analytics in the dashboard

## Project Structure

```
MYCPE_One/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database connection
│   ├── auth.py              # JWT authentication
│   ├── routes_*.py          # API route handlers
│   ├── pdf.py               # PDF generation
│   ├── email_service.py     # Email delivery
│   ├── init_db.py           # Database initialization
│   └── seed.py              # Demo data seeding
│
└── frontend/
    ├── src/
    │   ├── app/             # Next.js app routes
    │   ├── components/      # React components
    │   └── lib/             # Utilities & API client
    └── public/
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_ALGORITHM` | JWT algorithm (default: HS256) | No |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Either Resend or SMTP |
| `RESEND_FROM_EMAIL` | From email address | Either Resend or SMTP |
| `SMTP_HOST` | SMTP server host | Either Resend or SMTP |
| `SMTP_PORT` | SMTP server port | Either Resend or SMTP |
| `SMTP_USER` | SMTP username | Either Resend or SMTP |
| `SMTP_PASSWORD` | SMTP password | Either Resend or SMTP |
| `SMTP_FROM_EMAIL` | SMTP from address | Either Resend or SMTP |

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

## Database Schema

- **users** - User accounts with authentication
- **user_settings** - Business info, tax rates, invoice templates
- **clients** - Client contact information
- **invoices** - Invoice records with public tokens
- **invoice_line_items** - Invoice line items

## Security Notes

- ⚠️ Never commit `.env` files
- ⚠️ Change `JWT_SECRET` in production
- ⚠️ Use strong passwords
- ⚠️ Enable HTTPS in production
- ⚠️ Rotate API keys regularly

## Deployment

### Backend (Render)
- Deployed at: https://billflow-mycpe1.onrender.com
- Python 3.11.9 pinned via `backend/.python-version`
- Requires: PostgreSQL database, JWT_SECRET, and FRONTEND_URL env vars
- First deploy: run migrations via Alembic if needed

### Frontend (Vercel)
- Set `NEXT_PUBLIC_API_URL=https://billflow-mycpe1.onrender.com`
- Build command: `npm run build`
- Output directory: `.next`
- Root Directory: `frontend`

## License

MIT

## Support

For issues or questions, open an issue on GitHub.
