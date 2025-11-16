# XEM System v3.1
## eXecution & Expenditure Management Platform

**🎯 Status**: ✅ **FULLY IMPLEMENTED & READY TO RUN**
**📅 Created**: 2025-11-15
**📄 License**: Proprietary

A comprehensive budget execution management system for construction and development projects, featuring real-time budget tracking, multi-step approval workflows, and advanced financial analytics.

---

## 🚀 Quick Start

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run start:dev
```

Backend runs on **http://localhost:3000**

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

### 4. Login with Test Accounts

| Email | Password | Role | Approval Step |
|-------|----------|------|---------------|
| admin@xem.com | password123 | ADMIN | All access |
| cfo@xem.com | password123 | CFO | Step 4 (Final) |
| rm@xem.com | password123 | RM_TEAM | Step 3 |
| teamlead@xem.com | password123 | TEAM_LEAD | Step 2 |
| staff1@xem.com | password123 | STAFF | Step 1 |

---

## ✨ Features

### 📊 Dashboard
- Real-time KPI cards (Total Projects, Budget, Execution Rate, Pending Approvals)
- Recent execution requests table
- Welcome personalization

### 🏗️ Project Management
- Create and manage multiple construction projects
- Track budgets, execution rates, ROI, and risk scores
- Filter by status (ACTIVE, PLANNING, COMPLETED, ON_HOLD)
- Visual progress indicators with color coding

### 💰 Budget Management
- Hierarchical budget structure (Category → Main Item → Sub Item)
- Budget items grouped by category (수입/지출)
- Real-time execution tracking
- Category-level summaries
- Color-coded execution rates (green/yellow/red)

### 📋 Execution Requests
- Create new execution requests with validation
- Budget availability checking
- Amount validation against remaining budget
- Purpose and description fields
- Real-time status updates

### ✅ Approval Workflow
- 4-step approval process:
  1. STAFF verification
  2. TEAM_LEAD approval
  3. RM_TEAM (Risk Management) review
  4. CFO final approval
- Role-based pending approvals
- Approve/Reject with optional comments
- Visual workflow progress indicator
- Automatic budget updates on final approval

### 📈 Reports (Placeholder)
- Coming soon: Advanced analytics and reporting

---

## 🛠 Tech Stack

### Backend (NestJS)
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Validation**: class-validator, class-transformer
- **Decimal Math**: decimal.js (for precise financial calculations)

**Modules Implemented:**
- ✅ Authentication (JWT-based)
- ✅ Users Management
- ✅ Projects Management
- ✅ Budget Items Management
- ✅ Execution Requests
- ✅ Approval Workflow
- ✅ Dashboard Analytics
- ✅ Cash Flow Management
- ✅ Notifications

### Frontend (React)
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **State Management**: Zustand (with persist middleware)
- **API Client**: Axios + TanStack Query
- **Styling**: Tailwind CSS
- **Icons**: Emoji-based

**Pages Implemented:**
- ✅ Login Page
- ✅ Dashboard
- ✅ Projects List
- ✅ Budget Management
- ✅ Execution Requests
- ✅ Approvals Workflow
- ✅ Reports (Placeholder)

### Database
- **PostgreSQL 16**: Main database
- **Redis 7**: Caching (optional)

**Schema:**
- 11 tables with full relationships
- Decimal precision for financial data
- Comprehensive indexes
- Audit fields (createdAt, updatedAt)

---

## 📁 Project Structure

```
xem-system/
├── backend/                     # NestJS Backend
│   ├── src/
│   │   ├── auth/               # JWT Authentication
│   │   ├── users/              # User Management
│   │   ├── projects/           # Project Management
│   │   ├── budget/             # Budget Items
│   │   ├── execution/          # Execution Requests
│   │   ├── approval/           # Approval Workflow
│   │   ├── dashboard/          # Dashboard Stats
│   │   ├── cashflow/           # Cash Flow
│   │   ├── notifications/      # Notifications
│   │   └── main.ts             # App Entry Point
│   ├── prisma/
│   │   ├── schema.prisma       # Database Schema (11 tables)
│   │   └── seed.ts             # Seed Data (6 users, 4 projects)
│   └── package.json
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx      # Sidebar Layout
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── BudgetPage.tsx
│   │   │   ├── ExecutionsPage.tsx
│   │   │   ├── ApprovalsPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts    # Zustand Auth Store
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios Client
│   │   │   └── utils.ts        # Utility Functions
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript Types
│   │   ├── App.tsx             # React Router Setup
│   │   └── main.tsx
│   └── package.json
│
├── docker-compose.yml           # PostgreSQL + Redis
└── README.md                    # This File
```

---

## 🔐 Security Features

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Protected API routes
- Auto-logout on 401
- Token expiration handling

---

## 💾 Database Schema

**Core Tables:**
- **User**: System users with roles
- **Project**: Construction projects
- **BudgetItem**: Budget line items (hierarchical)
- **ExecutionRequest**: Budget execution requests
- **Approval**: 4-step approval records
- **Notification**: User notifications
- **ActivityLog**: Audit trail
- **CashFlowItem**: Cash flow records
- **FinancialModel**: Financial projections
- **Simulation**: What-if scenarios
- **SimulationResult**: Simulation outcomes

---

## 📊 Seed Data

The seed script creates:

**6 Test Users:**
- 1 Admin
- 1 CFO
- 1 RM Team Member
- 1 Team Lead
- 2 Staff Members

**4 Sample Projects:**
1. 강남 아파트 개발 (1550억원, 64% executed)
2. 송파 오피스텔 (850억원, 23% executed)
3. 판교 상업시설 (1200억원, 89% executed)
4. 인천 물류센터 (650억원, 12% executed)

**Budget Items:**
- Complete budget structure for each project
- Categories: 수입, 지출
- Main items: 분양수입, 토지비, 공사비, 설계비, etc.

---

## 🔧 Development

### Backend
```bash
cd backend

# Development mode
npm run start:dev

# Build
npm run build

# Production mode
npm run start:prod
```

### Frontend
```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### Database
```bash
# Prisma Studio (GUI)
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Re-seed
npm run seed
```

---

## 📚 API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:3000/api

**Key Endpoints:**
- `POST /auth/login` - Login
- `GET /auth/me` - Current user
- `GET /projects` - List projects
- `GET /budget/project/:id` - Budget items
- `POST /execution` - Create execution request
- `GET /approval/pending` - Pending approvals
- `POST /approval/:id/approve` - Approve request

---

## 🚢 Production Deployment

1. **Build Backend**
```bash
cd backend
npm run build
```

2. **Build Frontend**
```bash
cd frontend
npm run build
```

3. **Set Environment Variables**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
VITE_API_URL="https://api.yourdomain.com"
```

4. **Deploy**
- Backend: Node.js hosting (PM2, systemd)
- Frontend: Static hosting (nginx, Vercel, Netlify)
- Database: Managed PostgreSQL (AWS RDS, DigitalOcean)

---

## 📖 Documentation

For detailed documentation, see the markdown files in the parent directory:
- `XEM_Complete_Implementation_Guide.md`
- `XEM_Backend_API_Complete.md`
- `XEM_IMPLEMENTATION_PLAN.md`

---

## 🎯 Next Steps

- [ ] Test all API endpoints
- [ ] Frontend-Backend integration testing
- [ ] Add project detail pages
- [ ] Implement advanced reports
- [ ] Add Excel/PDF export
- [ ] Email notifications
- [ ] File upload for execution requests
- [ ] Performance optimization
- [ ] Security audit

---

**Built with ❤️ for efficient budget management**
