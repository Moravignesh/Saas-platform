# ContentHub – Subscription-Based Content Platform

A full-stack SaaS application with Admin Dashboard built with **FastAPI** (backend) and **React.js** (frontend).

---

## 🗂️ Project Structure

```
saas-platform/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── routers/          # API route handlers
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Auth utilities
│   │   ├── config.py         # Environment settings
│   │   └── database.py       # DB engine & session
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                  # Environment variables
│
└── frontend/                 # React + Vite frontend
    ├── src/
    │   ├── api/              # Axios API client
    │   ├── components/       # Shared components + layout
    │   ├── context/          # Auth context
    │   ├── pages/
    │   │   ├── admin/        # Admin dashboard pages
    │   │   ├── creator/      # Creator studio pages
    │   │   ├── subscriber/   # Subscriber pages
    │   │   └── auth/         # Login / Register
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── package.json
```

---
## Demo videos

frontend video: https://drive.google.com/file/d/1Jr_6hQDQUl9toful9dGf9DtaZG9F68wS/view?usp=sharing

Backend video: https://drive.google.com/file/d/1zpLQyraHFdyGySN_XyaJym4ldY0oJbvH/view?usp=sharing


## ⚙️ Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- (Optional) Stripe account for payments

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`  
Interactive docs (Swagger): `http://localhost:8000/docs`

> **Auto-seeded admin account:**  
> Email: `admin@platform.com`  
> Password: `Admin@123`

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔐 Demo Accounts

Use the **demo buttons on the login page** to auto-fill credentials, or register manually.

| Role       | Email                    | Password      |
|------------|--------------------------|---------------|
| Admin      | admin@platform.com       | Admin@123     |
| Creator    | *(register as creator)*  | your choice   |
| Subscriber | *(register as subscriber)* | your choice |

---

## 💳 Stripe Integration

The platform supports Stripe Checkout. To enable real payments:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your **test mode** keys from the Stripe Dashboard
3. Update `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_ID=price_your_price_id
```

4. For webhooks in development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:8000/subscriptions/webhook
```

> **Demo mode:** If Stripe keys are not configured, the platform automatically activates subscriptions in demo mode without real payments.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |
| GET  | `/auth/me` | Get current user |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/content` | List all content (gated) |
| POST | `/content` | Create content (creator only) |
| GET  | `/content/{id}` | Get content by ID |
| PUT  | `/content/{id}` | Update content |
| DELETE | `/content/{id}` | Delete content |
| GET  | `/content/{id}/comments` | Get comments |
| POST | `/content/{id}/comments` | Add comment |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/subscriptions/create-session` | Create Stripe checkout |
| POST | `/subscriptions/webhook` | Stripe webhook handler |
| GET  | `/subscriptions/status` | Get user subscriptions |
| POST | `/subscriptions/activate-demo` | Activate demo subscription |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/creator` | Creator analytics |
| GET | `/dashboard/user` | Subscriber dashboard |

### Admin (admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics/summary` | Platform summary stats |
| GET | `/admin/analytics/revenue` | Revenue chart data |
| GET | `/admin/analytics/users` | User growth data |
| GET | `/admin/analytics/subscriptions` | Subscription distribution |
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/{id}/block` | Block/unblock user |
| DELETE | `/admin/users/{id}` | Delete user |
| GET | `/admin/content` | List all content |
| DELETE | `/admin/content/{id}` | Remove content |
| GET | `/admin/subscriptions` | List all subscriptions |

---

## 🗄️ Database Schema

```
users
  id, email, username, hashed_password, role, is_active, is_blocked, created_at

content
  id, title, description, body, content_url, is_premium, creator_id, created_at, updated_at

subscriptions
  id, subscriber_id, creator_id, status, start_date, expiry_date,
  stripe_transaction_id, stripe_session_id, amount, created_at

comments
  id, content_id, author_id, text, created_at
```

---

## 🌟 Features

### Authentication & RBAC
- JWT-based authentication
- Three roles: Admin, Creator, Subscriber
- Protected routes on both frontend and backend

### Content Management
- Creators publish free or premium content
- Rich text body + optional URL attachment
- Edit / delete own content

### Subscription System
- Stripe Checkout integration (test mode)
- Webhook-confirmed payment activation
- 30-day subscription cycle
- Demo mode (no Stripe needed)

### Access Control
- Free content: publicly accessible
- Premium content: subscribers only
- Expired subscriptions: access blocked
- Lock UI with "Subscribe to unlock" CTA

### Admin Dashboard
- Analytics cards: users, revenue, subscriptions, content
- Revenue bar chart (last 14 days)
- User growth line chart
- Subscription distribution pie chart
- User management: block/unblock, delete
- Content moderation: remove inappropriate content
- Subscription monitoring: full table view

### Creator Dashboard
- Total subscribers & revenue
- Content count
- Recent subscription activity

### Subscriber Dashboard
- Active subscriptions with expiry
- Accessible content list
- Billing history

### Comments & Engagement
- Per-content comment threads
- Timestamps and author attribution

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | SQLite (dev) — swap to PostgreSQL for prod |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Payments | Stripe API |
| Frontend | React 18, React Router v6, Vite |
| Charts | Recharts |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Icons | lucide-react |

---

## 🔄 Switching to PostgreSQL

1. Install: `pip install asyncpg`
2. Update `.env`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/saas_platform
```

---

## 📝 Environment Variables

```env
# backend/.env
SECRET_KEY=your-32-char-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite+aiosqlite:///./saas_platform.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5173
```
