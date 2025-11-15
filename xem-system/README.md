# XEM System v3.1
## Production-Ready Budget Execution Management Platform

**🎯 Status**: ✅ **READY TO BUILD**
**📅 Created**: 2025-11-15
**📄 License**: MIT Open Source

---

## 🚀 Quick Start

### 1. Start Database
```bash
docker-compose up -d postgres redis
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

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### 5. Login
- Email: `staff1@xem.com`
- Password: `password123`

---

## 📦 Tech Stack

**Backend:**
- NestJS
- Prisma + PostgreSQL
- JWT Authentication

**Frontend:**
- React 18 + TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- Zustand + TanStack Query

**Database:**
- PostgreSQL 16
- Redis 7 (optional)

---

## 📚 Documentation

All detailed documentation is in the parent directory markdown files.

---

**Happy Coding! 🚀**
