# XEM 예산집행관리 시스템 문서

## 목차

1. [시스템 개요](#시스템-개요)
2. [기술 스택](#기술-스택)
3. [시스템 아키텍처](#시스템-아키텍처)
4. [설치 및 실행](#설치-및-실행)
5. [데이터베이스 설계](#데이터베이스-설계)
6. [주요 기능](#주요-기능)
7. [API 엔드포인트](#api-엔드포인트)
8. [프론트엔드 구조](#프론트엔드-구조)
9. [비즈니스 로직](#비즈니스-로직)
10. [배포 가이드](#배포-가이드)

---

## 시스템 개요

XEM(eXecution Management)은 부동산 개발 프로젝트의 예산 및 집행을 관리하는 ERP 시스템입니다.

### 핵심 기능
- **예산 관리**: 프로젝트별 예산 항목 관리, 변경예산 추적
- **집행 관리**: 집행 요청 생성, 다단계 승인 워크플로우
- **현금흐름(CF) 관리**: 월별 실적/전망 추적, 차이분석
- **재무 분석**: 시나리오 분석, 재무 모델링, KPI 대시보드
- **보고서**: Excel 내보내기, 실시간 대시보드

### 사용자 역할
- **ADMIN**: 시스템 관리자
- **CFO**: 재무 담당자
- **RM_TEAM**: 리스크 관리팀
- **TEAM_LEAD**: 팀장
- **APPROVER**: 승인자
- **STAFF**: 일반 직원

---

## 기술 스택

### Backend
- **프레임워크**: NestJS 10.3.0
- **언어**: TypeScript 5.3.3
- **ORM**: Prisma 5.8.0
- **데이터베이스**: PostgreSQL
- **인증**: JWT (passport-jwt)
- **파일 처리**: ExcelJS 4.4.0, XLSX 0.18.5
- **보안**: Helmet, bcrypt, Rate Limiting

### Frontend
- **프레임워크**: React 18
- **언어**: TypeScript
- **라우팅**: React Router v6
- **상태 관리**: Zustand
- **데이터 페칭**: TanStack Query (React Query)
- **스타일링**: Tailwind CSS
- **아이콘**: Heroicons
- **차트**: Recharts

### 개발 도구
- **패키지 매니저**: npm
- **빌드 도구**: Vite (frontend), NestJS CLI (backend)
- **코드 품질**: ESLint, Prettier
- **테스트**: Jest

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │ Budget   │  │Execution │  │ Reports │ │
│  │  Pages   │  │  Pages   │  │  Pages   │  │  Pages  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │              │              │            │     │
│  ┌──────────────────────────────────────────────────┐   │
│  │         TanStack Query + Zustand Stores          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTP/REST API
                          │
┌─────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Auth    │  │  Budget  │  │Execution │  │Financial│ │
│  │ Module   │  │  Module  │  │  Module  │  │ Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │              │              │            │     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Prisma ORM Layer                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Users   │  │ Projects │  │  Budget  │  │CashFlow │ │
│  │  Table   │  │  Table   │  │  Tables  │  │  Table  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 설치 및 실행

### 사전 요구사항
- Node.js 20.x 이상
- PostgreSQL 14 이상
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone <repository-url>
cd aI_ERP1
```

### 2. Backend 설정

```bash
cd xem-system/backend

# 의존성 설치
npm install

# 환경 변수 설정
# .env 파일 생성 후 다음 내용 추가:
```

**.env 파일 예시:**
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/xem_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Email (선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

```bash
# Prisma 설정
npx prisma generate
npx prisma db push

# 시드 데이터 생성
npx prisma db seed

# 서버 실행
npm run start:dev
```

### 3. Frontend 설정

```bash
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 접속

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Prisma Studio**: `npx prisma studio` (포트 5555)

### 테스트 계정

```
admin@xem.com / password123 (ADMIN)
cfo@xem.com / password123 (CFO)
rm@xem.com / password123 (RM_TEAM)
teamlead@xem.com / password123 (TEAM_LEAD)
approver1@xem.com / password123 (APPROVER)
approver2@xem.com / password123 (APPROVER)
staff1@xem.com / password123 (STAFF)
staff2@xem.com / password123 (STAFF)
```

---

## 데이터베이스 설계

### 핵심 테이블

#### User (사용자)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(STAFF)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  ADMIN
  CFO
  RM_TEAM
  TEAM_LEAD
  APPROVER
  STAFF
}
```

#### Project (프로젝트)
```prisma
model Project {
  id              String    @id @default(uuid())
  code            String    @unique
  name            String
  location        String?
  totalBudget     Decimal
  startDate       DateTime
  endDate         DateTime?
  status          String    @default("PLANNING")
  description     String?
  budgetItems     BudgetItem[]
  executions      ExecutionRequest[]
  cashFlowItems   CashFlowItem[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### BudgetItem (예산 항목)
```prisma
model BudgetItem {
  id                     String   @id @default(uuid())
  projectId              String
  project                Project  @relation(fields: [projectId], references: [id])
  category               String   // 수입, 필수사업비
  mainItem               String   // 토지비, 공사비, 설계비 등
  subItem                String   // 세부 항목
  initialBudget          Decimal  // 초기 예산
  currentBudget          Decimal  // 현재 예산 (변경 반영)
  executedAmount         Decimal  @default(0)
  remainingBeforeExec    Decimal  // 집행 전 잔액
  remainingAfterExec     Decimal  // 집행 후 잔액
  pendingExecutionAmount Decimal  @default(0)
  executionRate          Float    @default(0) // 집행률 (%)
  displayOrder           Int      // 표시 순서
  isActive               Boolean  @default(true)
  changeReason           String?  // 예산 변경 사유
  changedAt              DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

#### ExecutionRequest (집행 요청)
```prisma
model ExecutionRequest {
  id              String            @id @default(uuid())
  requestNumber   String            @unique // EXE-2024-0001
  projectId       String
  project         Project           @relation(fields: [projectId], references: [id])
  requesterId     String
  requester       User              @relation(fields: [requesterId], references: [id])
  budgetItemId    String
  budgetItem      BudgetItem        @relation(fields: [budgetItemId], references: [id])
  executionType   ExecutionType     // ACTUAL, NOMINAL, SPLIT
  totalAmount     Decimal
  actualAmount    Decimal?          // 실물 집행액
  nominalAmount   Decimal?          // 명목 집행액
  description     String
  purpose         String?
  status          ExecutionStatus   @default(PENDING)
  currentStep     Int               @default(1)
  totalSteps      Int               @default(2)
  approvals       Approval[]
  requestedAt     DateTime          @default(now())
  completedAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

enum ExecutionType {
  ACTUAL   // 실물 집행
  NOMINAL  // 명목 집행
  SPLIT    // 실물+명목 혼합
}

enum ExecutionStatus {
  PENDING    // 승인 대기
  APPROVED   // 승인 완료
  REJECTED   // 반려
  CANCELLED  // 취소
}
```

#### CashFlowItem (현금흐름)
```prisma
model CashFlowItem {
  id                      String    @id @default(uuid())
  projectId               String
  project                 Project   @relation(fields: [projectId], references: [id])
  type                    String    // INFLOW, OUTFLOW
  category                String    // 수입, 필수사업비
  mainItem                String
  subItem                 String?
  description             String?
  budgetAmount            Decimal   // 예산액
  forecastAmount          Decimal   // 전망액
  actualAmount            Decimal   @default(0) // 실제액
  varianceAmount          Decimal   @default(0) // 차이액 (actual - budget)
  varianceReason          String?   // 차이 사유
  isVarianceApproved      Boolean   @default(false)
  actualExecutionType     String?   // ACTUAL, NOMINAL, SPLIT
  actualExecutionAmount   Decimal?  // 실물 집행액
  nominalExecutionAmount  Decimal?  // 명목 집행액
  executionNote           String?
  monthIndex              Int       // 0-11 (프로젝트 시작 기준 월)
  plannedDate             DateTime
  forecastDate            DateTime?
  actualDate              DateTime?
  isRecurring             Boolean   @default(false)
  recurringMonths         Int?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
}
```

---

## 주요 기능

### 1. 예산 관리

#### 예산 개요 (BudgetPage)
- 7개 컬럼 구조: 항목, 초기예산, 변경예산, 집행액, 진행요청, 잔액, 집행률
- 수입 항목에서 PF 제외 (집행 요청에서는 포함)
- 필수사업비 순서: 토지비 → 공사비 → 설계비 → 부담금 → 마케팅비 → 금융비용
- 클릭 가능한 항목으로 상세 드릴다운
- 실시간 집행률 계산 및 색상 코딩

#### 예산 항목 관리 (BudgetManagementPage)
- 예산 항목 CRUD
- 변경예산 추적 및 사유 기록
- 집행 전/후 잔액 자동 계산
- 항목별 정렬 및 순서 관리

#### 예산 이체 (BudgetTransferPage)
- 항목 간 예산 이체 요청
- 다단계 승인 워크플로우
- 이체 이력 추적

### 2. 집행 관리

#### 집행 요청 (ExecutionsPage)
- 집행 요청 생성 (실물/명목/혼합)
- 다단계 승인 워크플로우
- 요청 상태 추적 (대기/승인/반려)
- 승인 단계별 알림

#### 집행 히스토리 (ExecutionHistoryPage)
- 전체 집행 내역 조회
- 필터링 및 검색
- Excel 내보내기
- 집행 유형별 통계

#### 승인 관리 (ApprovalsPage)
- 승인 대기 목록
- 승인/반려 처리
- 승인 의견 작성
- 다음 승인자 지정

### 3. 현금흐름(CF) 관리

#### CF 테이블 (CashFlowPage)
- 월별 현금흐름 추적 (12개월)
- 실적(Actual) vs 전망(Forecast) 비교
- 차이 분석 및 승인 워크플로우
- 실물/명목 집행 구분
- Excel 내보내기
- 월별 필터링 및 검색

**주요 컬럼:**
- 구분 (수입/지출)
- 항목명
- 예산액
- 전망액
- 실적액
- 차이액
- 차이사유
- 실물집행
- 명목집행
- 집행메모
- 차이승인 상태

#### CF 분석
- 월별 누적 현금흐름
- 최저 현금 시점 분석
- 예산 대비 전망 차이율
- 카테고리별 집계

### 4. 재무 분석

#### 시나리오 분석 (SimulationPage)
- 분양가/공사비/금융비용 시뮬레이션
- 실시간 ROI 계산
- 민감도 분석
- 시나리오 비교 차트

#### 재무 모델 (FinancialModelPage)
- NPV, IRR 계산
- 자금조달 계획
- 손익분기점 분석
- KPI 대시보드

#### 대시보드 (DashboardPage)
- 프로젝트 현황 요약
- 예산/집행 통계
- 최근 승인 내역
- 알림 센터

### 5. 보고서

#### ReportsPage
- 예산 집행 보고서
- 현금흐름 보고서
- 프로젝트 진행 보고서
- 커스텀 보고서 생성
- PDF/Excel 내보내기

---

## API 엔드포인트

### Authentication
```
POST   /auth/login              # 로그인
POST   /auth/register           # 회원가입
GET    /auth/me                 # 현재 사용자 정보
POST   /auth/refresh            # 토큰 갱신
```

### Projects
```
GET    /projects                # 프로젝트 목록
GET    /projects/:id            # 프로젝트 상세
POST   /projects                # 프로젝트 생성
PUT    /projects/:id            # 프로젝트 수정
DELETE /projects/:id            # 프로젝트 삭제
```

### Budget
```
GET    /budget/:projectId       # 프로젝트 예산 조회
GET    /budget/item/:id         # 예산 항목 상세
POST   /budget/:projectId       # 예산 항목 생성
PUT    /budget/item/:id         # 예산 항목 수정
DELETE /budget/item/:id         # 예산 항목 삭제
POST   /budget/transfer         # 예산 이체 요청
GET    /budget/transfers        # 이체 목록
```

### Execution
```
GET    /execution               # 집행 요청 목록
GET    /execution/:id           # 집행 요청 상세
POST   /execution               # 집행 요청 생성
PUT    /execution/:id           # 집행 요청 수정
DELETE /execution/:id           # 집행 요청 취소
GET    /execution/history       # 집행 히스토리
POST   /execution/:id/approve   # 집행 승인
POST   /execution/:id/reject    # 집행 반려
```

### Cash Flow
```
GET    /financial/cashflow/:projectId              # CF 목록
GET    /financial/cashflow/:projectId/summary      # CF 요약
POST   /financial/cashflow/:projectId              # CF 항목 생성
PUT    /financial/cashflow/:id                     # CF 항목 수정
DELETE /financial/cashflow/:id                     # CF 항목 삭제
POST   /financial/cashflow/:id/approve-variance    # 차이 승인
GET    /financial/cashflow/:projectId/export       # Excel 내보내기
GET    /financial/cashflow/:projectId/analytics    # CF 분석
```

### Financial
```
GET    /financial/model/:projectId                 # 재무 모델 조회
POST   /financial/model/:projectId                 # 재무 모델 생성
PUT    /financial/model/:id                        # 재무 모델 수정
POST   /financial/simulate/:projectId              # 시나리오 시뮬레이션
GET    /financial/analysis/:projectId              # 재무 분석
```

### Approvals
```
GET    /approval/pending                           # 승인 대기 목록
GET    /approval/:id                               # 승인 상세
POST   /approval/:id/approve                       # 승인
POST   /approval/:id/reject                        # 반려
GET    /approval/history                           # 승인 히스토리
```

### Analytics
```
GET    /analytics/dashboard/:projectId             # 대시보드 데이터
GET    /analytics/budget-execution/:projectId      # 예산집행 통계
GET    /analytics/cashflow-trend/:projectId        # 현금흐름 추이
GET    /analytics/kpi/:projectId                   # KPI 지표
```

---

## 프론트엔드 구조

### 디렉토리 구조
```
frontend/
├── src/
│   ├── components/           # 공통 컴포넌트
│   │   ├── Layout.tsx       # 레이아웃 (사이드바, 헤더)
│   │   ├── KPICard.tsx      # KPI 카드
│   │   └── ...
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── DashboardPage.tsx
│   │   ├── BudgetPage.tsx
│   │   ├── BudgetManagementPage.tsx
│   │   ├── BudgetTransferPage.tsx
│   │   ├── ExecutionsPage.tsx
│   │   ├── ExecutionHistoryPage.tsx
│   │   ├── ExecutionDetailPage.tsx
│   │   ├── CashFlowPage.tsx
│   │   ├── SimulationPage.tsx
│   │   ├── FinancialModelPage.tsx
│   │   ├── ApprovalsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── ...
│   ├── stores/              # Zustand 상태 관리
│   │   ├── authStore.ts
│   │   └── ...
│   ├── lib/                 # 유틸리티
│   │   ├── api.ts          # Axios 인스턴스
│   │   ├── formatters.ts   # 포맷팅 함수
│   │   └── exportUtils.ts  # Excel 내보내기
│   ├── types/              # TypeScript 타입
│   │   └── index.ts
│   ├── App.tsx             # 라우팅 설정
│   ├── main.tsx            # 엔트리 포인트
│   └── index.css           # Tailwind CSS
├── public/
├── package.json
└── vite.config.ts
```

### 주요 컴포넌트

#### Layout.tsx
E-ink 스타일의 미니멀 디자인:
- 고정 사이드바 (폭: 288px)
- 계층적 네비게이션
- 사용자 정보 표시
- 반응형 메뉴

#### KPI Card 패턴
```typescript
<div className="bg-white rounded-xl border-2 border-ink-4 p-6">
  <div className="text-xs text-ink-6 mb-1">지표명</div>
  <div className="text-2xl font-bold text-ink-9 font-mono">
    {value}
  </div>
  <div className="text-[10px] text-ink-5 mt-1">설명</div>
</div>
```

### 상태 관리

#### authStore (Zustand)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}
```

### API 통신

#### TanStack Query 패턴
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['budget', projectId],
  queryFn: async () => {
    const response = await api.get(`/budget/${projectId}`);
    return response.data;
  },
});

const mutation = useMutation({
  mutationFn: async (data) => {
    return api.post('/budget', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['budget'] });
  },
});
```

---

## 비즈니스 로직

### 1. 예산 계산

#### 집행률 계산
```typescript
executionRate = (executedAmount / currentBudget) * 100
```

#### 잔액 계산
```typescript
remainingBeforeExec = currentBudget - executedAmount
remainingAfterExec = remainingBeforeExec - pendingExecutionAmount
```

#### 집행률 알림 레벨
- 🟢 0-24%: 정상
- 🟡 25-49%: 주의
- 🟠 50-74%: 경고
- 🔴 75-100%: 위험

### 2. 승인 워크플로우

#### 기본 승인 흐름
```
STAFF 요청 → TEAM_LEAD 승인 → APPROVER 승인 → 완료
```

#### 승인 상태 전이
```
PENDING → APPROVED (승인 완료)
PENDING → REJECTED (반려)
APPROVED → CANCELLED (취소, 특정 조건)
```

### 3. 현금흐름 계산

#### 차이액 계산
```typescript
varianceAmount = actualAmount - budgetAmount
variancePercentage = (varianceAmount / budgetAmount) * 100
```

#### 월별 집계
```typescript
monthlyInflow = sum(items where type === 'INFLOW' and month === currentMonth)
monthlyOutflow = sum(items where type === 'OUTFLOW' and month === currentMonth)
monthlyNet = monthlyInflow - monthlyOutflow
```

#### 누적 현금흐름
```typescript
cumulativeCash[i] = cumulativeCash[i-1] + monthlyNet[i]
```

### 4. 재무 분석

#### ROI 계산
```typescript
totalRevenue = 분양수입 + 기타수입
totalCost = 토지비 + 공사비 + 설계비 + ... + 금융비용
profit = totalRevenue - totalCost
ROI = (profit / totalCost) * 100
```

#### NPV 계산
```typescript
NPV = Σ(CF[t] / (1 + discountRate)^t) - initialInvestment
```

#### IRR 계산
Newton-Raphson 방법으로 NPV = 0이 되는 할인율 계산

---

## 배포 가이드

### 프로덕션 빌드

#### Backend
```bash
cd xem-system/backend

# 빌드
npm run build

# 프로덕션 실행
npm run start:prod
```

#### Frontend
```bash
cd xem-system/frontend

# 빌드
npm run build

# dist 폴더 → 정적 파일 서버 배포
```

### 환경 변수 (프로덕션)

**.env.production:**
```env
DATABASE_URL="postgresql://user:pass@production-db:5432/xem_db"
JWT_SECRET="strong-production-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL="https://xem.yourdomain.com"

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=app-specific-password
```

### Docker 배포

#### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: xem_db
      POSTGRES_USER: xem_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./xem-system/backend
    environment:
      DATABASE_URL: postgresql://xem_user:secure_password@postgres:5432/xem_db
      JWT_SECRET: production-secret
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./xem-system/frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Nginx 설정

```nginx
server {
    listen 80;
    server_name xem.yourdomain.com;

    # Frontend
    location / {
        root /var/www/xem/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 보안 체크리스트

- [ ] JWT_SECRET 변경
- [ ] 데이터베이스 비밀번호 강화
- [ ] HTTPS 설정 (Let's Encrypt)
- [ ] CORS 제한 설정
- [ ] Rate Limiting 활성화
- [ ] 입력 검증 강화
- [ ] SQL Injection 방지 (Prisma 사용으로 기본 보호)
- [ ] XSS 방지 (React 기본 보호)
- [ ] 정기 백업 설정
- [ ] 로그 모니터링 설정

### 성능 최적화

#### Backend
- 데이터베이스 인덱스 최적화
- Query 최적화 (N+1 문제 해결)
- 캐싱 (Redis)
- Connection Pooling
- API 응답 압축 (Compression)

#### Frontend
- 코드 스플리팅
- 이미지 최적화
- CDN 사용
- Service Worker (PWA)
- Lazy Loading

---

## 유지보수

### 데이터베이스 마이그레이션
```bash
# 스키마 변경 후
npx prisma migrate dev --name description_of_change

# 프로덕션 적용
npx prisma migrate deploy
```

### 백업
```bash
# PostgreSQL 백업
pg_dump -U xem_user xem_db > backup_$(date +%Y%m%d).sql

# 복원
psql -U xem_user xem_db < backup_20240101.sql
```

### 모니터링

#### 추천 도구
- **애플리케이션**: PM2, New Relic
- **데이터베이스**: pgAdmin, Datadog
- **로그**: ELK Stack, Papertrail
- **업타임**: UptimeRobot, Pingdom

---

## 문제 해결

### 자주 발생하는 문제

#### 1. PostgreSQL 연결 오류
```bash
# Windows에서 PostgreSQL 서비스 시작
net start postgresql-x64-14

# 연결 확인
psql -U postgres -d xem_db
```

#### 2. Prisma 스키마 동기화 오류
```bash
# 스키마 리셋 (주의: 데이터 손실)
npx prisma migrate reset

# 재생성
npx prisma generate
npx prisma db push
```

#### 3. CORS 오류
backend의 main.ts에서 CORS 설정 확인:
```typescript
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

#### 4. JWT 인증 실패
- 토큰 만료 확인
- JWT_SECRET 환경변수 확인
- 브라우저 localStorage 확인

---

## 추가 리소스

### 참고 문서
- [NestJS 공식 문서](https://docs.nestjs.com)
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [React 공식 문서](https://react.dev)
- [TanStack Query 문서](https://tanstack.com/query)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

### 코드 예제
- 상세 코드 예제는 각 파일의 주석 참조
- 비즈니스 로직은 서비스 레이어에 집중
- API 엔드포인트는 컨트롤러에서 관리

---

## 라이선스

MIT License

---

## 연락처

프로젝트 관련 문의: [your-email@example.com]

---

**최종 업데이트**: 2024-11-19
**문서 버전**: 1.0.0
