# ContentHub – Subscription Content Platform

Full-stack SaaS with Admin Dashboard | FastAPI + React

---

##  Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@platform.com | Admin@123 |
| Creator | register at /register | your choice |
| Subscriber | register at /register | your choice |

---

## 📡 Swagger Usage

1. Open http://localhost:8000/docs
2. Click **Authorize** (top right)
3. Enter: `username = admin@platform.com`, `password = Admin@123`
4. Click Authorize → all protected endpoints unlock

For **POST /auth/login** directly use JSON:
```json
{ "email": "admin@platform.com", "password": "Admin@123" }
```

---

## ✅ Fixes Applied

| Issue | Fix |
|-------|-----|
| Circular import on startup | All `__init__.py` files emptied |
| Swagger CORS / Failed to fetch | `allow_origins=["*"]` in main.py |
| Swagger Authorize 422 error | Separate `/auth/token` route for form fields |
| `/auth/login` trailing slash 422 | Removed trailing slash in frontend api |

---

## 🗄️ Database

SQLite by default — no setup needed. File created automatically at `backend/saas_platform.db`.

To switch to PostgreSQL:
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/saas_platform
```
Then: `pip install asyncpg`
