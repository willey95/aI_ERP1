# XEM 데이터베이스 스키마 설계 문서

## 개요

XEM 시스템의 PostgreSQL 데이터베이스 스키마 상세 설명서입니다.

---

## ERD (Entity Relationship Diagram)

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ creates
       │
       ▼
┌─────────────────────┐        ┌──────────────────┐
│   ExecutionRequest  │───────▶│    Approval      │
└──────┬──────────────┘        └──────────────────┘
       │ belongs to
       │
       ▼
┌─────────────────────┐        ┌──────────────────┐
│      Project        │───────▶│   BudgetItem     │
└──────┬──────────────┘        └──────────────────┘
       │
       ├──────────────────────▶│  CashFlowItem    │
       │                        └──────────────────┘
       │
       ├──────────────────────▶│  FinancialModel  │
       │                        └──────────────────┘
       │
       └──────────────────────▶│  BudgetTransfer  │
                                └──────────────────┘
```

---

## 테이블 상세

### 1. User (사용자)

사용자 정보 및 권한 관리

```sql
CREATE TABLE "User" (
  id          VARCHAR(36) PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'STAFF',
  department  VARCHAR(100),
  position    VARCHAR(100),
  phone       VARCHAR(20),
  isActive    BOOLEAN DEFAULT true,
  lastLoginAt TIMESTAMP,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_isActive ON "User"(isActive);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `email`: 이메일 (로그인 ID, UNIQUE)
- `password`: bcrypt 해시된 비밀번호
- `name`: 사용자 이름
- `role`: 사용자 역할 (ADMIN, CFO, RM_TEAM, TEAM_LEAD, APPROVER, STAFF)
- `department`: 부서
- `position`: 직위
- `phone`: 연락처
- `isActive`: 활성 상태
- `lastLoginAt`: 마지막 로그인 시각
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**역할 (UserRole Enum):**
- `ADMIN`: 시스템 관리자
- `CFO`: 재무담당자
- `RM_TEAM`: 리스크관리팀
- `TEAM_LEAD`: 팀장
- `APPROVER`: 승인자
- `STAFF`: 일반 직원

---

### 2. Project (프로젝트)

부동산 개발 프로젝트 정보

```sql
CREATE TABLE "Project" (
  id              VARCHAR(36) PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(200) NOT NULL,
  location        VARCHAR(500),
  type            VARCHAR(50),
  totalBudget     DECIMAL(20, 2) NOT NULL,
  startDate       DATE NOT NULL,
  endDate         DATE,
  completionDate  DATE,
  status          VARCHAR(20) DEFAULT 'PLANNING',
  description     TEXT,
  units           INTEGER,
  totalArea       DECIMAL(15, 2),
  createdById     VARCHAR(36),
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (createdById) REFERENCES "User"(id)
);

CREATE INDEX idx_project_code ON "Project"(code);
CREATE INDEX idx_project_status ON "Project"(status);
CREATE INDEX idx_project_startDate ON "Project"(startDate);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `code`: 프로젝트 코드 (예: PRJ-2024-001)
- `name`: 프로젝트 명
- `location`: 위치/주소
- `type`: 프로젝트 유형 (아파트, 오피스텔, 상가 등)
- `totalBudget`: 총 예산
- `startDate`: 시작일
- `endDate`: 종료 예정일
- `completionDate`: 실제 완료일
- `status`: 상태 (PLANNING, IN_PROGRESS, COMPLETED, CANCELLED)
- `description`: 프로젝트 설명
- `units`: 세대/호수
- `totalArea`: 총 면적 (평방미터)
- `createdById`: 생성자 ID
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**상태 (ProjectStatus):**
- `PLANNING`: 기획 단계
- `IN_PROGRESS`: 진행 중
- `COMPLETED`: 완료
- `CANCELLED`: 취소

---

### 3. BudgetItem (예산 항목)

프로젝트의 세부 예산 항목

```sql
CREATE TABLE "BudgetItem" (
  id                      VARCHAR(36) PRIMARY KEY,
  projectId               VARCHAR(36) NOT NULL,
  category                VARCHAR(50) NOT NULL,
  mainItem                VARCHAR(100) NOT NULL,
  subItem                 VARCHAR(100) NOT NULL,
  description             TEXT,
  initialBudget           DECIMAL(20, 2) NOT NULL,
  currentBudget           DECIMAL(20, 2) NOT NULL,
  executedAmount          DECIMAL(20, 2) DEFAULT 0,
  remainingBeforeExec     DECIMAL(20, 2),
  remainingAfterExec      DECIMAL(20, 2),
  pendingExecutionAmount  DECIMAL(20, 2) DEFAULT 0,
  executionRate           DECIMAL(5, 2) DEFAULT 0,
  displayOrder            INTEGER DEFAULT 0,
  isActive                BOOLEAN DEFAULT true,
  changeReason            TEXT,
  changedAt               TIMESTAMP,
  createdAt               TIMESTAMP DEFAULT NOW(),
  updatedAt               TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE
);

CREATE INDEX idx_budget_projectId ON "BudgetItem"(projectId);
CREATE INDEX idx_budget_category ON "BudgetItem"(category);
CREATE INDEX idx_budget_mainItem ON "BudgetItem"(mainItem);
CREATE INDEX idx_budget_displayOrder ON "BudgetItem"(displayOrder);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `projectId`: 프로젝트 ID (FK)
- `category`: 대분류 (수입, 필수사업비)
- `mainItem`: 중분류 (토지비, 공사비, 설계비, 부담금, 마케팅비, 금융비용)
- `subItem`: 소분류 (토지 매입비, 직접공사비 등)
- `description`: 상세 설명
- `initialBudget`: 초기 예산
- `currentBudget`: 현재 예산 (변경 반영)
- `executedAmount`: 집행 완료 금액
- `remainingBeforeExec`: 집행 전 잔액 = currentBudget - executedAmount
- `remainingAfterExec`: 집행 후 잔액 = remainingBeforeExec - pendingExecutionAmount
- `pendingExecutionAmount`: 승인 대기 중인 집행 금액
- `executionRate`: 집행률 (%) = (executedAmount / currentBudget) * 100
- `displayOrder`: 화면 표시 순서
- `isActive`: 활성 상태
- `changeReason`: 예산 변경 사유
- `changedAt`: 예산 변경 일시
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**카테고리 구조:**
```
수입
├── PF대출
│   └── PF 총액
├── 분양수입
│   ├── 아파트 분양
│   └── 상가 분양
└── 보조금
    └── 정부보조금

필수사업비
├── 토지비 (1순위)
│   ├── 토지 매입비
│   ├── 취득세 및 등록세
│   └── 법무사 수수료
├── 공사비 (2순위)
│   ├── 직접공사비
│   ├── 간접공사비
│   ├── 가설공사비
│   ├── 토목공사비
│   └── 조경공사비
├── 설계비 (3순위)
│   ├── 건축설계
│   ├── 구조설계
│   ├── 기계/전기설계
│   └── 감리비
├── 부담금 (4순위)
│   ├── 학교용지부담금
│   ├── 광역교통시설부담금
│   ├── 상하수도원인자부담금
│   ├── 도시가스공급시설비
│   └── 개발부담금
├── 마케팅비 (5순위)
│   ├── 분양대행수수료
│   ├── 광고선전비
│   ├── 홍보물 제작비
│   └── 모델하우스 운영비
└── 금융비용 (6순위)
    ├── PF 이자
    ├── PF 수수료
    ├── 보증수수료
    └── 신탁수수료
```

---

### 4. ExecutionRequest (집행 요청)

예산 집행 요청 및 승인 관리

```sql
CREATE TABLE "ExecutionRequest" (
  id                    VARCHAR(36) PRIMARY KEY,
  requestNumber         VARCHAR(50) UNIQUE NOT NULL,
  projectId             VARCHAR(36) NOT NULL,
  requesterId           VARCHAR(36) NOT NULL,
  budgetItemId          VARCHAR(36) NOT NULL,
  executionType         VARCHAR(20) NOT NULL,
  totalAmount           DECIMAL(20, 2) NOT NULL,
  actualAmount          DECIMAL(20, 2),
  nominalAmount         DECIMAL(20, 2),
  description           TEXT NOT NULL,
  purpose               TEXT,
  attachments           JSONB,
  status                VARCHAR(20) DEFAULT 'PENDING',
  currentStep           INTEGER DEFAULT 1,
  totalSteps            INTEGER DEFAULT 2,
  requestedAt           TIMESTAMP DEFAULT NOW(),
  completedAt           TIMESTAMP,
  rejectedAt            TIMESTAMP,
  rejectionReason       TEXT,
  createdAt             TIMESTAMP DEFAULT NOW(),
  updatedAt             TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE,
  FOREIGN KEY (requesterId) REFERENCES "User"(id),
  FOREIGN KEY (budgetItemId) REFERENCES "BudgetItem"(id)
);

CREATE INDEX idx_exec_requestNumber ON "ExecutionRequest"(requestNumber);
CREATE INDEX idx_exec_projectId ON "ExecutionRequest"(projectId);
CREATE INDEX idx_exec_requesterId ON "ExecutionRequest"(requesterId);
CREATE INDEX idx_exec_status ON "ExecutionRequest"(status);
CREATE INDEX idx_exec_requestedAt ON "ExecutionRequest"(requestedAt);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `requestNumber`: 요청 번호 (예: EXE-2024-0001)
- `projectId`: 프로젝트 ID (FK)
- `requesterId`: 요청자 ID (FK)
- `budgetItemId`: 예산 항목 ID (FK)
- `executionType`: 집행 유형 (ACTUAL, NOMINAL, SPLIT)
- `totalAmount`: 총 집행 금액
- `actualAmount`: 실물 집행 금액 (executionType=ACTUAL or SPLIT)
- `nominalAmount`: 명목 집행 금액 (executionType=NOMINAL or SPLIT)
- `description`: 집행 내용
- `purpose`: 집행 목적
- `attachments`: 첨부 파일 정보 (JSON)
- `status`: 승인 상태
- `currentStep`: 현재 승인 단계
- `totalSteps`: 총 승인 단계
- `requestedAt`: 요청 일시
- `completedAt`: 완료 일시
- `rejectedAt`: 반려 일시
- `rejectionReason`: 반려 사유
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**집행 유형 (ExecutionType):**
- `ACTUAL`: 실물 집행 (실제 자금 지출)
- `NOMINAL`: 명목 집행 (계약 체결, 자금 미지출)
- `SPLIT`: 혼합 (실물 + 명목)

**승인 상태 (ExecutionStatus):**
- `PENDING`: 승인 대기
- `APPROVED`: 승인 완료
- `REJECTED`: 반려
- `CANCELLED`: 취소

---

### 5. Approval (승인)

집행 요청의 각 승인 단계 기록

```sql
CREATE TABLE "Approval" (
  id                  VARCHAR(36) PRIMARY KEY,
  executionRequestId  VARCHAR(36) NOT NULL,
  approverId          VARCHAR(36) NOT NULL,
  step                INTEGER NOT NULL,
  status              VARCHAR(20) DEFAULT 'PENDING',
  comments            TEXT,
  approvedAt          TIMESTAMP,
  rejectedAt          TIMESTAMP,
  createdAt           TIMESTAMP DEFAULT NOW(),
  updatedAt           TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (executionRequestId) REFERENCES "ExecutionRequest"(id) ON DELETE CASCADE,
  FOREIGN KEY (approverId) REFERENCES "User"(id)
);

CREATE INDEX idx_approval_executionRequestId ON "Approval"(executionRequestId);
CREATE INDEX idx_approval_approverId ON "Approval"(approverId);
CREATE INDEX idx_approval_status ON "Approval"(status);
CREATE INDEX idx_approval_step ON "Approval"(step);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `executionRequestId`: 집행 요청 ID (FK)
- `approverId`: 승인자 ID (FK)
- `step`: 승인 단계 (1, 2, 3, ...)
- `status`: 승인 상태
- `comments`: 승인/반려 의견
- `approvedAt`: 승인 일시
- `rejectedAt`: 반려 일시
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**승인 워크플로우 예시:**
```
Step 1: STAFF → TEAM_LEAD
Step 2: TEAM_LEAD → APPROVER
Step 3: APPROVER → CFO (고액 집행 시)
```

---

### 6. CashFlowItem (현금흐름)

월별 현금흐름 추적 및 실적/전망 관리

```sql
CREATE TABLE "CashFlowItem" (
  id                      VARCHAR(36) PRIMARY KEY,
  projectId               VARCHAR(36) NOT NULL,
  type                    VARCHAR(20) NOT NULL,
  category                VARCHAR(50) NOT NULL,
  mainItem                VARCHAR(100) NOT NULL,
  subItem                 VARCHAR(100),
  description             TEXT,
  budgetAmount            DECIMAL(20, 2) NOT NULL,
  forecastAmount          DECIMAL(20, 2) NOT NULL,
  actualAmount            DECIMAL(20, 2) DEFAULT 0,
  varianceAmount          DECIMAL(20, 2) DEFAULT 0,
  varianceReason          TEXT,
  isVarianceApproved      BOOLEAN DEFAULT false,
  actualExecutionType     VARCHAR(20),
  actualExecutionAmount   DECIMAL(20, 2),
  nominalExecutionAmount  DECIMAL(20, 2),
  executionNote           TEXT,
  monthIndex              INTEGER NOT NULL,
  plannedDate             DATE NOT NULL,
  forecastDate            DATE,
  actualDate              DATE,
  isRecurring             BOOLEAN DEFAULT false,
  recurringMonths         INTEGER,
  createdAt               TIMESTAMP DEFAULT NOW(),
  updatedAt               TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE
);

CREATE INDEX idx_cashflow_projectId ON "CashFlowItem"(projectId);
CREATE INDEX idx_cashflow_type ON "CashFlowItem"(type);
CREATE INDEX idx_cashflow_monthIndex ON "CashFlowItem"(monthIndex);
CREATE INDEX idx_cashflow_plannedDate ON "CashFlowItem"(plannedDate);
CREATE INDEX idx_cashflow_isVarianceApproved ON "CashFlowItem"(isVarianceApproved);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `projectId`: 프로젝트 ID (FK)
- `type`: 유형 (INFLOW, OUTFLOW)
- `category`: 카테고리 (수입, 필수사업비)
- `mainItem`: 주 항목
- `subItem`: 하위 항목
- `description`: 설명
- `budgetAmount`: 예산액
- `forecastAmount`: 전망액
- `actualAmount`: 실적액
- `varianceAmount`: 차이액 = actualAmount - budgetAmount
- `varianceReason`: 차이 발생 사유
- `isVarianceApproved`: 차이 승인 여부
- `actualExecutionType`: 실제 집행 유형
- `actualExecutionAmount`: 실물 집행액
- `nominalExecutionAmount`: 명목 집행액
- `executionNote`: 집행 메모
- `monthIndex`: 월 인덱스 (0-11, 프로젝트 시작 기준)
- `plannedDate`: 계획일
- `forecastDate`: 전망일
- `actualDate`: 실제일
- `isRecurring`: 반복 항목 여부
- `recurringMonths`: 반복 개월수
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**월 인덱스 계산:**
```typescript
// 프로젝트 시작일: 2024-01-01
// 현재 날짜: 2024-11-01
monthIndex = 10 // (11월 = 10번째 월, 0-based)

// 현재 월 기준
// 실적(Actual): monthIndex < 현재 monthIndex
// 전망(Forecast): monthIndex >= 현재 monthIndex
```

---

### 7. BudgetTransfer (예산 이체)

예산 항목 간 이체 요청 및 승인

```sql
CREATE TABLE "BudgetTransfer" (
  id                VARCHAR(36) PRIMARY KEY,
  transferNumber    VARCHAR(50) UNIQUE NOT NULL,
  projectId         VARCHAR(36) NOT NULL,
  requesterId       VARCHAR(36) NOT NULL,
  fromBudgetItemId  VARCHAR(36) NOT NULL,
  toBudgetItemId    VARCHAR(36) NOT NULL,
  amount            DECIMAL(20, 2) NOT NULL,
  reason            TEXT NOT NULL,
  status            VARCHAR(20) DEFAULT 'PENDING',
  requestedAt       TIMESTAMP DEFAULT NOW(),
  approvedAt        TIMESTAMP,
  approvedById      VARCHAR(36),
  rejectedAt        TIMESTAMP,
  rejectionReason   TEXT,
  createdAt         TIMESTAMP DEFAULT NOW(),
  updatedAt         TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE,
  FOREIGN KEY (requesterId) REFERENCES "User"(id),
  FOREIGN KEY (fromBudgetItemId) REFERENCES "BudgetItem"(id),
  FOREIGN KEY (toBudgetItemId) REFERENCES "BudgetItem"(id),
  FOREIGN KEY (approvedById) REFERENCES "User"(id)
);

CREATE INDEX idx_transfer_projectId ON "BudgetTransfer"(projectId);
CREATE INDEX idx_transfer_status ON "BudgetTransfer"(status);
CREATE INDEX idx_transfer_requestedAt ON "BudgetTransfer"(requestedAt);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `transferNumber`: 이체 번호 (예: TRF-2024-0001)
- `projectId`: 프로젝트 ID (FK)
- `requesterId`: 요청자 ID (FK)
- `fromBudgetItemId`: 출발 예산 항목 ID (FK)
- `toBudgetItemId`: 도착 예산 항목 ID (FK)
- `amount`: 이체 금액
- `reason`: 이체 사유
- `status`: 승인 상태
- `requestedAt`: 요청 일시
- `approvedAt`: 승인 일시
- `approvedById`: 승인자 ID (FK)
- `rejectedAt`: 반려 일시
- `rejectionReason`: 반려 사유
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

---

### 8. FinancialModel (재무 모델)

프로젝트 재무 분석 데이터

```sql
CREATE TABLE "FinancialModel" (
  id                    VARCHAR(36) PRIMARY KEY,
  projectId             VARCHAR(36) NOT NULL,
  modelName             VARCHAR(200) NOT NULL,
  totalRevenue          DECIMAL(20, 2),
  totalCost             DECIMAL(20, 2),
  expectedProfit        DECIMAL(20, 2),
  profitMargin          DECIMAL(5, 2),
  roi                   DECIMAL(5, 2),
  npv                   DECIMAL(20, 2),
  irr                   DECIMAL(5, 2),
  paybackPeriod         INTEGER,
  lowestCashPoint       DECIMAL(20, 2),
  lowestCashMonth       INTEGER,
  assumptions           JSONB,
  createdById           VARCHAR(36),
  createdAt             TIMESTAMP DEFAULT NOW(),
  updatedAt             TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (projectId) REFERENCES "Project"(id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES "User"(id)
);

CREATE INDEX idx_financial_projectId ON "FinancialModel"(projectId);
CREATE INDEX idx_financial_createdAt ON "FinancialModel"(createdAt);
```

**컬럼 설명:**
- `id`: UUID, 기본키
- `projectId`: 프로젝트 ID (FK)
- `modelName`: 모델 이름 (예: 기본 시나리오, 낙관적 시나리오)
- `totalRevenue`: 총 수입
- `totalCost`: 총 비용
- `expectedProfit`: 예상 이익
- `profitMargin`: 이익률 (%)
- `roi`: 투자 수익률 (%)
- `npv`: 순현재가치
- `irr`: 내부수익률 (%)
- `paybackPeriod`: 회수 기간 (개월)
- `lowestCashPoint`: 최저 현금 시점 금액
- `lowestCashMonth`: 최저 현금 시점 월
- `assumptions`: 가정 사항 (JSON)
- `createdById`: 생성자 ID (FK)
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

**assumptions JSON 예시:**
```json
{
  "discountRate": 0.08,
  "inflationRate": 0.02,
  "salesRate": 0.95,
  "constructionCostIncrease": 0.05,
  "interestRate": 0.045
}
```

---

## 뷰 (View)

### 1. vw_BudgetSummary (예산 요약)

```sql
CREATE VIEW vw_BudgetSummary AS
SELECT
  p.id AS projectId,
  p.code AS projectCode,
  p.name AS projectName,
  bi.category,
  bi.mainItem,
  SUM(bi.initialBudget) AS totalInitialBudget,
  SUM(bi.currentBudget) AS totalCurrentBudget,
  SUM(bi.executedAmount) AS totalExecuted,
  SUM(bi.remainingAfterExec) AS totalRemaining,
  AVG(bi.executionRate) AS avgExecutionRate
FROM "Project" p
LEFT JOIN "BudgetItem" bi ON p.id = bi.projectId
WHERE bi.isActive = true
GROUP BY p.id, p.code, p.name, bi.category, bi.mainItem;
```

### 2. vw_CashFlowSummary (현금흐름 요약)

```sql
CREATE VIEW vw_CashFlowSummary AS
SELECT
  projectId,
  monthIndex,
  SUM(CASE WHEN type = 'INFLOW' THEN budgetAmount ELSE 0 END) AS budgetInflow,
  SUM(CASE WHEN type = 'OUTFLOW' THEN budgetAmount ELSE 0 END) AS budgetOutflow,
  SUM(CASE WHEN type = 'INFLOW' THEN forecastAmount ELSE 0 END) AS forecastInflow,
  SUM(CASE WHEN type = 'OUTFLOW' THEN forecastAmount ELSE 0 END) AS forecastOutflow,
  SUM(CASE WHEN type = 'INFLOW' THEN actualAmount ELSE 0 END) AS actualInflow,
  SUM(CASE WHEN type = 'OUTFLOW' THEN actualAmount ELSE 0 END) AS actualOutflow,
  SUM(CASE WHEN type = 'INFLOW' THEN budgetAmount ELSE -budgetAmount END) AS netBudget,
  SUM(CASE WHEN type = 'INFLOW' THEN forecastAmount ELSE -forecastAmount END) AS netForecast,
  SUM(CASE WHEN type = 'INFLOW' THEN actualAmount ELSE -actualAmount END) AS netActual
FROM "CashFlowItem"
GROUP BY projectId, monthIndex
ORDER BY projectId, monthIndex;
```

---

## 트리거 (Trigger)

### 1. 예산 항목 업데이트 시 잔액 자동 계산

```sql
CREATE OR REPLACE FUNCTION update_budget_remaining()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remainingBeforeExec := NEW.currentBudget - NEW.executedAmount;
  NEW.remainingAfterExec := NEW.remainingBeforeExec - NEW.pendingExecutionAmount;
  NEW.executionRate := CASE
    WHEN NEW.currentBudget > 0 THEN (NEW.executedAmount / NEW.currentBudget) * 100
    ELSE 0
  END;
  NEW.updatedAt := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_item_update
  BEFORE UPDATE ON "BudgetItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_remaining();
```

### 2. 현금흐름 항목의 차이액 자동 계산

```sql
CREATE OR REPLACE FUNCTION update_cashflow_variance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.varianceAmount := NEW.actualAmount - NEW.budgetAmount;
  NEW.updatedAt := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cashflow_variance
  BEFORE INSERT OR UPDATE ON "CashFlowItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_cashflow_variance();
```

---

## 인덱스 전략

### 복합 인덱스

```sql
-- 프로젝트별 예산 항목 조회 최적화
CREATE INDEX idx_budget_project_category_order
ON "BudgetItem"(projectId, category, displayOrder);

-- 프로젝트별 월별 현금흐름 조회 최적화
CREATE INDEX idx_cashflow_project_month
ON "CashFlowItem"(projectId, monthIndex, type);

-- 승인 대기 목록 조회 최적화
CREATE INDEX idx_approval_status_created
ON "Approval"(status, createdAt DESC)
WHERE status = 'PENDING';

-- 집행 요청 목록 조회 최적화
CREATE INDEX idx_execution_project_status_date
ON "ExecutionRequest"(projectId, status, requestedAt DESC);
```

---

## 데이터 무결성 제약

### CHECK 제약

```sql
-- 예산 항목: 금액은 0 이상
ALTER TABLE "BudgetItem"
ADD CONSTRAINT chk_budget_amounts_positive
CHECK (
  initialBudget >= 0 AND
  currentBudget >= 0 AND
  executedAmount >= 0
);

-- 집행 요청: 총액은 실물+명목 합계
ALTER TABLE "ExecutionRequest"
ADD CONSTRAINT chk_execution_amounts
CHECK (
  (executionType = 'ACTUAL' AND totalAmount = actualAmount AND nominalAmount IS NULL) OR
  (executionType = 'NOMINAL' AND totalAmount = nominalAmount AND actualAmount IS NULL) OR
  (executionType = 'SPLIT' AND totalAmount = actualAmount + nominalAmount)
);

-- 집행률: 0~100% 범위
ALTER TABLE "BudgetItem"
ADD CONSTRAINT chk_execution_rate_range
CHECK (executionRate >= 0 AND executionRate <= 100);
```

---

## 백업 및 복원

### 백업 스크립트

```bash
#!/bin/bash
# backup.sh

DB_NAME="xem_db"
DB_USER="xem_user"
BACKUP_DIR="/var/backups/xem"
DATE=$(date +%Y%m%d_%H%M%S)

# Full backup
pg_dump -U $DB_USER -F c -b -v -f "$BACKUP_DIR/xem_full_$DATE.backup" $DB_NAME

# Schema only
pg_dump -U $DB_USER -s -f "$BACKUP_DIR/xem_schema_$DATE.sql" $DB_NAME

# Data only
pg_dump -U $DB_USER -a -f "$BACKUP_DIR/xem_data_$DATE.sql" $DB_NAME

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete
```

### 복원 스크립트

```bash
#!/bin/bash
# restore.sh

DB_NAME="xem_db"
DB_USER="xem_user"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  exit 1
fi

# Restore
pg_restore -U $DB_USER -d $DB_NAME -c -v $BACKUP_FILE
```

---

## 성능 최적화

### 파티셔닝 (대용량 데이터 처리)

```sql
-- CashFlowItem을 프로젝트별로 파티셔닝
CREATE TABLE "CashFlowItem_partitioned" (
  LIKE "CashFlowItem" INCLUDING ALL
) PARTITION BY LIST (projectId);

-- 프로젝트별 파티션 생성
CREATE TABLE "CashFlowItem_project1"
PARTITION OF "CashFlowItem_partitioned"
FOR VALUES IN ('project-uuid-1');

CREATE TABLE "CashFlowItem_project2"
PARTITION OF "CashFlowItem_partitioned"
FOR VALUES IN ('project-uuid-2');
```

### 테이블 통계 업데이트

```sql
-- 정기적으로 실행하여 쿼리 최적화
ANALYZE "BudgetItem";
ANALYZE "CashFlowItem";
ANALYZE "ExecutionRequest";
ANALYZE "Approval";
```

---

## 마이그레이션 가이드

### Prisma 마이그레이션 생성

```bash
# 스키마 변경 후
npx prisma migrate dev --name add_new_feature

# 마이그레이션 파일 확인
# prisma/migrations/YYYYMMDDHHMMSS_add_new_feature/migration.sql
```

### 수동 마이그레이션 예시

```sql
-- 20241119_add_execution_note.sql

-- 1. 컬럼 추가
ALTER TABLE "ExecutionRequest"
ADD COLUMN execution_note TEXT;

-- 2. 인덱스 추가
CREATE INDEX idx_execution_note
ON "ExecutionRequest"(execution_note)
WHERE execution_note IS NOT NULL;

-- 3. 데이터 마이그레이션 (필요시)
UPDATE "ExecutionRequest"
SET execution_note = description
WHERE execution_note IS NULL;
```

---

## 모니터링 쿼리

### 1. 느린 쿼리 확인

```sql
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. 테이블 크기 확인

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. 인덱스 사용률 확인

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

**최종 업데이트**: 2024-11-19
**문서 버전**: 1.0.0
