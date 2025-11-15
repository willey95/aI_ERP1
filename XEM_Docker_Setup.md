# XEM System - Docker & Database Setup
## Complete Development Environment

**Version**: 3.0  
**License**: MIT

---

## 🐳 Docker Compose Configuration

### File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: xem-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: xem_password
      POSTGRES_DB: xem_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/seed.sql:/docker-entrypoint-initdb.d/seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: xem-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: xem-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:xem_password@postgres:5432/xem_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      JWT_EXPIRES_IN: 7d
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run start:dev

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: xem-frontend
    environment:
      VITE_API_URL: http://localhost:3000/api
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev -- --host

volumes:
  postgres_data:
  redis_data:
```

---

## 🐳 Backend Dockerfile

### File: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:dev"]
```

---

## 🎨 Frontend Dockerfile

### File: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start application
CMD ["npm", "run", "dev", "--", "--host"]
```

---

## 🌱 Database Seed Data

### File: `backend/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.financialModel.deleteMany();
  await prisma.cashFlowItem.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.executionRequest.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // ============================================
  // 1. CREATE USERS
  // ============================================
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@xem.com',
      password: hashedPassword,
      name: '김관리',
      role: 'ADMIN',
      department: '경영지원팀',
      position: '시스템 관리자',
      phone: '010-1234-5678',
    },
  });

  const cfo = await prisma.user.create({
    data: {
      email: 'cfo@xem.com',
      password: hashedPassword,
      name: '박재무',
      role: 'CFO',
      department: '재무팀',
      position: 'CFO',
      phone: '010-2345-6789',
    },
  });

  const rmTeam = await prisma.user.create({
    data: {
      email: 'rm@xem.com',
      password: hashedPassword,
      name: '최위험',
      role: 'RM_TEAM',
      department: 'RM팀',
      position: 'RM팀장',
      phone: '010-3456-7890',
    },
  });

  const teamLead = await prisma.user.create({
    data: {
      email: 'teamlead@xem.com',
      password: hashedPassword,
      name: '이팀장',
      role: 'TEAM_LEAD',
      department: '사업팀',
      position: '팀장',
      phone: '010-4567-8901',
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff1@xem.com',
      password: hashedPassword,
      name: '정담당',
      role: 'STAFF',
      department: '사업팀',
      position: '대리',
      phone: '010-5678-9012',
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@xem.com',
      password: hashedPassword,
      name: '윤사원',
      role: 'STAFF',
      department: '사업팀',
      position: '사원',
      phone: '010-6789-0123',
    },
  });

  console.log('✅ Created 6 users');

  // ============================================
  // 2. CREATE PROJECTS
  // ============================================
  const project1 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-001',
      name: '강남 아파트 개발사업',
      location: '서울시 강남구 역삼동',
      projectType: 'SELF',
      status: 'ACTIVE',
      landArea: 3000,
      buildingArea: 1500,
      totalFloorArea: 25000,
      units: 250,
      startDate: new Date('2024-01-15'),
      completionDate: new Date('2026-12-31'),
      salesStartDate: new Date('2024-07-01'),
      initialBudget: 150000000000, // 1,500억
      currentBudget: 155000000000, // 1,550억 (예산 변경됨)
      executedAmount: 99200000000,  // 992억
      remainingBudget: 55800000000, // 558억
      executionRate: 64.0,
      expectedProfit: 25000000000,  // 250억
      roi: 16.1,
      riskScore: 72,
      createdById: staff1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-002',
      name: '판교 오피스텔 프로젝트',
      location: '경기도 성남시 분당구 판교동',
      projectType: 'SPC',
      status: 'ACTIVE',
      landArea: 2500,
      buildingArea: 1200,
      totalFloorArea: 18000,
      units: 180,
      startDate: new Date('2024-03-01'),
      completionDate: new Date('2026-08-31'),
      salesStartDate: new Date('2024-09-01'),
      initialBudget: 100000000000, // 1,000억
      currentBudget: 100000000000,
      executedAmount: 75000000000,  // 750억
      remainingBudget: 25000000000, // 250억
      executionRate: 75.0,
      expectedProfit: 18000000000,  // 180억
      roi: 18.0,
      riskScore: 58,
      createdById: staff2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-003',
      name: '송도 주상복합 단지',
      location: '인천시 연수구 송도동',
      projectType: 'JOINT',
      status: 'ACTIVE',
      landArea: 5000,
      buildingArea: 2000,
      totalFloorArea: 40000,
      units: 350,
      startDate: new Date('2023-09-01'),
      completionDate: new Date('2026-12-31'),
      salesStartDate: new Date('2024-03-01'),
      initialBudget: 200000000000, // 2,000억
      currentBudget: 210000000000, // 2,100억
      executedAmount: 189000000000, // 1,890억
      remainingBudget: 21000000000, // 210억
      executionRate: 90.0,
      expectedProfit: 30000000000,  // 300억
      roi: 14.3,
      riskScore: 85,
      createdById: staff1.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-004',
      name: '부산 해운대 재개발',
      location: '부산시 해운대구 우동',
      projectType: 'COOPERATIVE',
      status: 'PLANNING',
      landArea: 4000,
      buildingArea: 1800,
      totalFloorArea: 32000,
      units: 300,
      startDate: new Date('2024-06-01'),
      completionDate: new Date('2027-05-31'),
      salesStartDate: new Date('2025-01-01'),
      initialBudget: 180000000000, // 1,800억
      currentBudget: 180000000000,
      executedAmount: 54000000000,  // 540억
      remainingBudget: 126000000000, // 1,260억
      executionRate: 30.0,
      expectedProfit: 27000000000,  // 270억
      roi: 15.0,
      riskScore: 42,
      createdById: staff2.id,
    },
  });

  console.log('✅ Created 4 projects');

  // ============================================
  // 3. CREATE BUDGET ITEMS
  // ============================================
  // Project 1 Budget
  await createBudgetStructure(project1.id, 155000000000);
  await createBudgetStructure(project2.id, 100000000000);
  await createBudgetStructure(project3.id, 210000000000);
  await createBudgetStructure(project4.id, 180000000000);

  console.log('✅ Created budget items for all projects');

  // ============================================
  // 4. CREATE EXECUTION REQUESTS
  // ============================================
  const execution1 = await prisma.executionRequest.create({
    data: {
      requestNumber: 'EXE-2024-0001',
      projectId: project1.id,
      budgetItemId: (await prisma.budgetItem.findFirst({
        where: { projectId: project1.id, mainItem: '토지비' },
      }))!.id,
      requestedById: staff1.id,
      amount: 5000000000, // 50억
      executionDate: new Date('2024-11-20'),
      purpose: '토지 매입 잔금',
      description: '강남 역삼동 000-0 일대 토지 매입 잔금 지급',
      attachments: ['https://example.com/document1.pdf'],
      status: 'PENDING',
      currentStep: 2,
    },
  });

  // Create approvals for execution1
  await prisma.approval.createMany({
    data: [
      {
        executionRequestId: execution1.id,
        step: 1,
        approverRole: 'STAFF',
        approverId: staff1.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-15T09:00:00'),
      },
      {
        executionRequestId: execution1.id,
        step: 2,
        approverRole: 'TEAM_LEAD',
        status: 'PENDING',
      },
      {
        executionRequestId: execution1.id,
        step: 3,
        approverRole: 'RM_TEAM',
        status: 'PENDING',
      },
      {
        executionRequestId: execution1.id,
        step: 4,
        approverRole: 'CFO',
        status: 'PENDING',
      },
    ],
  });

  const execution2 = await prisma.executionRequest.create({
    data: {
      requestNumber: 'EXE-2024-0002',
      projectId: project2.id,
      budgetItemId: (await prisma.budgetItem.findFirst({
        where: { projectId: project2.id, mainItem: '공사비' },
      }))!.id,
      requestedById: staff2.id,
      amount: 3000000000, // 30억
      executionDate: new Date('2024-11-18'),
      purpose: '골조공사비 지급',
      description: '11월분 골조공사비',
      status: 'APPROVED',
      currentStep: 4,
      completedAt: new Date('2024-11-14T16:30:00'),
    },
  });

  await prisma.approval.createMany({
    data: [
      {
        executionRequestId: execution2.id,
        step: 1,
        approverRole: 'STAFF',
        approverId: staff2.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-13T10:00:00'),
      },
      {
        executionRequestId: execution2.id,
        step: 2,
        approverRole: 'TEAM_LEAD',
        approverId: teamLead.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-13T14:00:00'),
      },
      {
        executionRequestId: execution2.id,
        step: 3,
        approverRole: 'RM_TEAM',
        approverId: rmTeam.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-14T09:00:00'),
      },
      {
        executionRequestId: execution2.id,
        step: 4,
        approverRole: 'CFO',
        approverId: cfo.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-14T16:30:00'),
      },
    ],
  });

  const execution3 = await prisma.executionRequest.create({
    data: {
      requestNumber: 'EXE-2024-0003',
      projectId: project3.id,
      budgetItemId: (await prisma.budgetItem.findFirst({
        where: { projectId: project3.id, mainItem: '마케팅비' },
      }))!.id,
      requestedById: staff1.id,
      amount: 500000000, // 5억
      executionDate: new Date('2024-11-25'),
      purpose: '분양 광고비',
      description: '12월 TV 광고 및 온라인 마케팅',
      status: 'PENDING',
      currentStep: 3,
    },
  });

  await prisma.approval.createMany({
    data: [
      {
        executionRequestId: execution3.id,
        step: 1,
        approverRole: 'STAFF',
        approverId: staff1.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-16T09:00:00'),
      },
      {
        executionRequestId: execution3.id,
        step: 2,
        approverRole: 'TEAM_LEAD',
        approverId: teamLead.id,
        status: 'APPROVED',
        decidedAt: new Date('2024-11-16T11:00:00'),
      },
      {
        executionRequestId: execution3.id,
        step: 3,
        approverRole: 'RM_TEAM',
        status: 'PENDING',
      },
      {
        executionRequestId: execution3.id,
        step: 4,
        approverRole: 'CFO',
        status: 'PENDING',
      },
    ],
  });

  console.log('✅ Created 3 execution requests with approvals');

  // ============================================
  // 5. CREATE NOTIFICATIONS
  // ============================================
  await prisma.notification.createMany({
    data: [
      {
        userId: teamLead.id,
        projectId: project1.id,
        type: 'APPROVAL_REQUEST',
        title: '결재 요청',
        message: '정담당님이 강남 아파트 개발사업의 토지비 항목에 대해 50억원 집행을 요청했습니다.',
        severity: 'INFO',
      },
      {
        userId: rmTeam.id,
        projectId: project3.id,
        type: 'APPROVAL_REQUEST',
        title: '결재 요청',
        message: '정담당님이 송도 주상복합 단지의 마케팅비 항목에 대해 5억원 집행을 요청했습니다.',
        severity: 'INFO',
      },
      {
        userId: cfo.id,
        projectId: project3.id,
        type: 'EXECUTION_RATE_WARNING',
        title: '집행률 경고',
        message: '송도 주상복합 단지 프로젝트의 집행률이 90.0%에 도달했습니다.',
        severity: 'CRITICAL',
      },
      {
        userId: staff1.id,
        projectId: project1.id,
        type: 'RISK_ALERT',
        title: '리스크 알림',
        message: '강남 아파트 개발사업의 리스크 점수가 72점으로 주의가 필요합니다.',
        severity: 'WARNING',
      },
    ],
  });

  console.log('✅ Created notifications');

  // ============================================
  // 6. CREATE FINANCIAL MODELS
  // ============================================
  for (const project of [project1, project2, project3, project4]) {
    await prisma.financialModel.create({
      data: {
        projectId: project.id,
        version: 1,
        isActive: true,
        salesRate: 85,
        salesStartMonth: 6,
        constructionDelay: 0,
        costInflation: 0,
        interestRate: 4.5,
        monthlyProjections: generateMonthlyProjections(project),
        totalRevenue: project.currentBudget,
        totalCost: project.executedAmount,
        expectedProfit: project.expectedProfit,
        roi: project.roi,
        lowestCashPoint: -15000000000, // -150억
        lowestCashMonth: 12,
      },
    });
  }

  console.log('✅ Created financial models');

  // ============================================
  // 7. CREATE SIMULATIONS
  // ============================================
  await prisma.simulation.create({
    data: {
      projectId: project1.id,
      name: '분양 지연 3개월 시나리오',
      salesDelay: 3,
      salesRate: 75,
      costChange: 5,
      interestChange: 0.5,
      projectedProfit: 18000000000,
      projectedROI: 12.0,
      lowestCash: -20000000000,
      lowestCashMonth: 15,
      recommendations: {
        risks: ['분양 지연으로 인한 금융비용 증가', '현금흐름 악화'],
        actions: ['브릿지론 20억 추가 확보 필요', '마케팅 예산 10% 증액 권장'],
      },
      createdBy: staff1.id,
    },
  });

  console.log('✅ Created simulations');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📧 Login Credentials:');
  console.log('Admin:    admin@xem.com / password123');
  console.log('CFO:      cfo@xem.com / password123');
  console.log('RM Team:  rm@xem.com / password123');
  console.log('Team Lead: teamlead@xem.com / password123');
  console.log('Staff 1:  staff1@xem.com / password123');
  console.log('Staff 2:  staff2@xem.com / password123');
}

async function createBudgetStructure(projectId: string, totalBudget: number) {
  const budgetItems = [
    // 수입
    { category: '수입', mainItem: '분양수입', subItem: null, ratio: 1.0 },

    // 지출
    { category: '지출', mainItem: '토지비', subItem: '토지 매입비', ratio: 0.25 },
    { category: '지출', mainItem: '토지비', subItem: '취득세', ratio: 0.05 },
    
    { category: '지출', mainItem: '공사비', subItem: '건축공사비', ratio: 0.35 },
    { category: '지출', mainItem: '공사비', subItem: '토목공사비', ratio: 0.05 },
    { category: '지출', mainItem: '공사비', subItem: '기계설비공사비', ratio: 0.05 },
    
    { category: '지출', mainItem: '설계비', subItem: '건축설계', ratio: 0.02 },
    { category: '지출', mainItem: '설계비', subItem: '구조설계', ratio: 0.01 },
    
    { category: '지출', mainItem: '부담금', subItem: '학교용지부담금', ratio: 0.03 },
    { category: '지출', mainItem: '부담금', subItem: '기반시설부담금', ratio: 0.02 },
    
    { category: '지출', mainItem: '금융비용', subItem: '대출이자', ratio: 0.04 },
    
    { category: '지출', mainItem: '마케팅비', subItem: '광고선전비', ratio: 0.02 },
    { category: '지출', mainItem: '마케팅비', subItem: '모델하우스', ratio: 0.01 },
  ];

  let order = 0;

  for (const item of budgetItems) {
    const amount = totalBudget * item.ratio;
    const executionRate = Math.random() * 70; // 0-70% random execution
    const executed = amount * (executionRate / 100);
    const remaining = amount - executed;

    await prisma.budgetItem.create({
      data: {
        projectId,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: amount,
        currentBudget: amount,
        executedAmount: executed,
        remainingBudget: remaining,
        executionRate,
        displayOrder: order++,
      },
    });
  }
}

function generateMonthlyProjections(project: any) {
  const months = 36;
  const projections = [];
  
  for (let month = 1; month <= months; month++) {
    const inflow = month >= 6 ? parseFloat(project.currentBudget) * 0.85 / 24 : 0;
    const outflow = parseFloat(project.currentBudget) * 0.75 / 36;
    const netCashFlow = inflow - outflow;
    const cumulativeCash = month === 1 
      ? netCashFlow 
      : projections[month - 2].cumulativeCash + netCashFlow;

    projections.push({
      month,
      inflow,
      outflow,
      netCashFlow,
      cumulativeCash,
    });
  }

  return projections;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 📦 Package.json Scripts

### File: `backend/package.json`

```json
{
  "name": "xem-backend",
  "version": "3.0.0",
  "description": "XEM System Backend API",
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force && npm run db:seed"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@prisma/client": "^5.7.0",
    "bcrypt": "^5.1.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0",
    "prisma": "^5.7.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 🚀 Quick Start Commands

### Complete Setup

```bash
# 1. Clone and setup
git clone <your-repo>
cd xem-system

# 2. Start with Docker
docker-compose up -d

# 3. Wait for services to be healthy (30 seconds)
docker-compose ps

# 4. Run database migrations and seed
cd backend
npm run db:push
npm run db:seed

# 5. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Database: localhost:5432
```

### Development Without Docker

```bash
# Start PostgreSQL locally
createdb xem_db

# Backend
cd backend
npm install
cp .env.example .env  # Edit DATABASE_URL
npx prisma generate
npx prisma db push
npm run db:seed
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env  # Edit VITE_API_URL
npm run dev
```

---

## 🧪 Testing Seed Data

### Test Login Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@xem.com | password123 | System management |
| CFO | cfo@xem.com | password123 | Final approvals |
| RM Team | rm@xem.com | password123 | Risk management |
| Team Lead | teamlead@xem.com | password123 | Team approvals |
| Staff 1 | staff1@xem.com | password123 | Create executions |
| Staff 2 | staff2@xem.com | password123 | Create executions |

### Test Projects

1. **강남 아파트** (64% execution, Risk: 72)
2. **판교 오피스텔** (75% execution, Risk: 58)
3. **송도 주상복합** (90% execution, Risk: 85) ⚠️
4. **부산 재개발** (30% execution, Risk: 42)

### Test Workflows

```bash
# Workflow 1: Create new execution
1. Login as staff1@xem.com
2. Go to Execution Management
3. Create new execution request
4. Submit for approval

# Workflow 2: Approve execution
1. Login as teamlead@xem.com
2. Go to Approval page
3. See pending execution (EXE-2024-0001)
4. Approve or reject

# Workflow 3: View financial impact
1. Login as cfo@xem.com
2. Go to Projects
3. Click on "송도 주상복합"
4. See updated execution rate and risk score

# Workflow 4: Run simulation
1. Go to Simulation page
2. Select project
3. Adjust parameters (sales delay, cost change)
4. Run simulation
5. View AI recommendations
```

---

## 🗄️ Database Management

### View Database

```bash
# Prisma Studio (GUI)
cd backend
npm run db:studio
# Open http://localhost:5555
```

### Reset Database

```bash
cd backend
npm run db:reset
# This will:
# 1. Drop all tables
# 2. Run migrations
# 3. Run seed data
```

### Backup Database

```bash
# Docker
docker exec xem-postgres pg_dump -U postgres xem_db > backup.sql

# Local
pg_dump xem_db > backup.sql
```

### Restore Database

```bash
# Docker
docker exec -i xem-postgres psql -U postgres xem_db < backup.sql

# Local
psql xem_db < backup.sql
```

---

## 🔍 Environment Variables Reference

### Backend `.env`

```bash
# Database
DATABASE_URL="postgresql://postgres:xem_password@localhost:5432/xem_db"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:3000/api
```

---

## 🎯 Next Steps

1. ✅ Run `docker-compose up` - Everything starts
2. ✅ Run `npm run db:seed` - Get test data
3. ✅ Login with test accounts - Start testing
4. ✅ Create execution request - Test workflow
5. ✅ Approve execution - See financial recalculation
6. ✅ Run simulation - Test AI recommendations

All data is ready to use! No manual setup required.

---

**Happy Coding! 🚀**

*Last Updated: 2025-11-16*  
*License: MIT Open Source*
