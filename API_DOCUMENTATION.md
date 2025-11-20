# XEM API 문서

REST API 엔드포인트 상세 문서

---

## 기본 정보

**Base URL**: `http://localhost:3000`

**인증**: JWT Bearer Token

**Content-Type**: `application/json`

**인증 헤더 예시**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 인증 (Authentication)

### POST /auth/login

사용자 로그인

**Request Body:**
```json
{
  "email": "admin@xem.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@xem.com",
    "name": "관리자",
    "role": "ADMIN",
    "isActive": true
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### POST /auth/register

신규 사용자 등록

**Request Body:**
```json
{
  "email": "newuser@xem.com",
  "password": "securePassword123",
  "name": "홍길동",
  "role": "STAFF",
  "department": "사업팀",
  "position": "대리"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "newuser@xem.com",
  "name": "홍길동",
  "role": "STAFF",
  "createdAt": "2024-11-19T10:00:00Z"
}
```

---

### GET /auth/me

현재 로그인한 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "admin@xem.com",
  "name": "관리자",
  "role": "ADMIN",
  "department": "경영지원팀",
  "position": "부장",
  "isActive": true,
  "lastLoginAt": "2024-11-19T09:30:00Z"
}
```

---

## 프로젝트 (Projects)

### GET /projects

프로젝트 목록 조회

**Query Parameters:**
- `status` (optional): 프로젝트 상태 필터 (PLANNING, IN_PROGRESS, COMPLETED)
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 20)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "PRJ-2024-001",
      "name": "강남 아파트 개발",
      "location": "서울시 강남구",
      "totalBudget": "155000000000",
      "startDate": "2024-01-01",
      "endDate": "2025-12-31",
      "status": "IN_PROGRESS",
      "units": 500,
      "totalArea": "45000.00"
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET /projects/:id

특정 프로젝트 상세 조회

**Path Parameters:**
- `id`: 프로젝트 ID (UUID)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "code": "PRJ-2024-001",
  "name": "강남 아파트 개발",
  "location": "서울시 강남구 테헤란로 123",
  "type": "아파트",
  "totalBudget": "155000000000",
  "startDate": "2024-01-01",
  "endDate": "2025-12-31",
  "status": "IN_PROGRESS",
  "description": "강남구 도시재개발 아파트 프로젝트",
  "units": 500,
  "totalArea": "45000.00",
  "createdAt": "2023-12-01T00:00:00Z",
  "updatedAt": "2024-11-19T10:00:00Z",
  "_count": {
    "budgetItems": 31,
    "executions": 5,
    "cashFlowItems": 372
  }
}
```

---

### POST /projects

새 프로젝트 생성

**Request Body:**
```json
{
  "code": "PRJ-2024-005",
  "name": "판교 오피스텔 개발",
  "location": "경기도 성남시 분당구",
  "type": "오피스텔",
  "totalBudget": "85000000000",
  "startDate": "2025-01-01",
  "endDate": "2026-12-31",
  "description": "판교 테크노밸리 오피스텔",
  "units": 300,
  "totalArea": "25000.00"
}
```

**Response (201 Created):**
```json
{
  "id": "new-uuid",
  "code": "PRJ-2024-005",
  "name": "판교 오피스텔 개발",
  "status": "PLANNING",
  "createdAt": "2024-11-19T10:00:00Z"
}
```

---

### PUT /projects/:id

프로젝트 정보 수정

**Path Parameters:**
- `id`: 프로젝트 ID

**Request Body:**
```json
{
  "name": "판교 오피스텔 개발 (수정)",
  "totalBudget": "90000000000",
  "status": "IN_PROGRESS"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "code": "PRJ-2024-005",
  "name": "판교 오피스텔 개발 (수정)",
  "totalBudget": "90000000000",
  "status": "IN_PROGRESS",
  "updatedAt": "2024-11-19T10:30:00Z"
}
```

---

## 예산 (Budget)

### GET /budget/:projectId

프로젝트의 예산 항목 목록 조회

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Query Parameters:**
- `category` (optional): 카테고리 필터 (수입, 필수사업비)
- `mainItem` (optional): 주 항목 필터

**Response (200 OK):**
```json
{
  "projectId": "uuid",
  "items": [
    {
      "id": "uuid",
      "category": "필수사업비",
      "mainItem": "토지비",
      "subItem": "토지 매입비",
      "initialBudget": "36425000000",
      "currentBudget": "38246250000",
      "executedAmount": "36333937500",
      "remainingBeforeExec": "1912312500",
      "remainingAfterExec": "1912312500",
      "pendingExecutionAmount": "0",
      "executionRate": 95,
      "displayOrder": 0,
      "isActive": true,
      "changeReason": "토지 매입비 토지 매입비 가격 조정으로 인한 예산 증액 (5%)",
      "changedAt": "2024-11-10T00:00:00Z"
    }
  ],
  "summary": {
    "totalInitialBudget": "155000000000",
    "totalCurrentBudget": "157925000000",
    "totalExecuted": "105000000000",
    "totalRemaining": "52925000000",
    "averageExecutionRate": 66.5
  }
}
```

---

### GET /budget/item/:id

특정 예산 항목 상세 조회

**Path Parameters:**
- `id`: 예산 항목 ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "category": "필수사업비",
  "mainItem": "공사비",
  "subItem": "직접공사비",
  "description": "아파트 직접공사비용",
  "initialBudget": "49600000000",
  "currentBudget": "49600000000",
  "executedAmount": "28768000000",
  "remainingBeforeExec": "20832000000",
  "remainingAfterExec": "20832000000",
  "pendingExecutionAmount": "0",
  "executionRate": 58,
  "displayOrder": 5,
  "isActive": true,
  "history": [
    {
      "date": "2024-11-15",
      "type": "EXECUTION",
      "amount": "5000000000",
      "description": "11월 공사비 집행"
    }
  ]
}
```

---

### POST /budget/:projectId

예산 항목 생성

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Request Body:**
```json
{
  "category": "필수사업비",
  "mainItem": "기타비용",
  "subItem": "보험료",
  "initialBudget": "500000000",
  "displayOrder": 100
}
```

**Response (201 Created):**
```json
{
  "id": "new-uuid",
  "projectId": "uuid",
  "category": "필수사업비",
  "mainItem": "기타비용",
  "subItem": "보험료",
  "initialBudget": "500000000",
  "currentBudget": "500000000",
  "executedAmount": "0",
  "executionRate": 0,
  "createdAt": "2024-11-19T10:00:00Z"
}
```

---

### PUT /budget/item/:id

예산 항목 수정

**Path Parameters:**
- `id`: 예산 항목 ID

**Request Body:**
```json
{
  "currentBudget": "550000000",
  "changeReason": "보험료 인상에 따른 예산 증액"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "currentBudget": "550000000",
  "changeReason": "보험료 인상에 따른 예산 증액",
  "changedAt": "2024-11-19T10:00:00Z",
  "updatedAt": "2024-11-19T10:00:00Z"
}
```

---

### POST /budget/transfer

예산 이체 요청

**Request Body:**
```json
{
  "projectId": "uuid",
  "fromBudgetItemId": "uuid-1",
  "toBudgetItemId": "uuid-2",
  "amount": "1000000000",
  "reason": "공사비 부족으로 마케팅비에서 이체"
}
```

**Response (201 Created):**
```json
{
  "id": "new-uuid",
  "transferNumber": "TRF-2024-0001",
  "projectId": "uuid",
  "fromBudgetItemId": "uuid-1",
  "toBudgetItemId": "uuid-2",
  "amount": "1000000000",
  "reason": "공사비 부족으로 마케팅비에서 이체",
  "status": "PENDING",
  "requestedAt": "2024-11-19T10:00:00Z"
}
```

---

### GET /budget/transfers

예산 이체 목록 조회

**Query Parameters:**
- `projectId` (optional): 프로젝트 ID 필터
- `status` (optional): 상태 필터 (PENDING, APPROVED, REJECTED)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "transferNumber": "TRF-2024-0001",
      "projectId": "uuid",
      "fromBudgetItem": {
        "mainItem": "마케팅비",
        "subItem": "광고선전비"
      },
      "toBudgetItem": {
        "mainItem": "공사비",
        "subItem": "직접공사비"
      },
      "amount": "1000000000",
      "reason": "공사비 부족으로 마케팅비에서 이체",
      "status": "APPROVED",
      "requestedAt": "2024-11-15T10:00:00Z",
      "approvedAt": "2024-11-16T14:30:00Z"
    }
  ]
}
```

---

## 집행 (Execution)

### GET /execution

집행 요청 목록 조회

**Query Parameters:**
- `projectId` (optional): 프로젝트 ID 필터
- `status` (optional): 상태 필터
- `executionType` (optional): 집행 유형 필터
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 항목 수

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "requestNumber": "EXE-2024-0001",
      "project": {
        "id": "uuid",
        "code": "PRJ-2024-001",
        "name": "강남 아파트 개발"
      },
      "requester": {
        "id": "uuid",
        "name": "홍길동",
        "role": "STAFF"
      },
      "budgetItem": {
        "mainItem": "설계비",
        "subItem": "건축설계"
      },
      "executionType": "SPLIT",
      "totalAmount": "750000000",
      "actualAmount": "250000000",
      "nominalAmount": "500000000",
      "description": "11월 건축설계비 집행",
      "status": "PENDING",
      "currentStep": 1,
      "totalSteps": 2,
      "requestedAt": "2024-11-19T09:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET /execution/:id

집행 요청 상세 조회

**Path Parameters:**
- `id`: 집행 요청 ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "requestNumber": "EXE-2024-0001",
  "project": {
    "id": "uuid",
    "code": "PRJ-2024-001",
    "name": "강남 아파트 개발"
  },
  "requester": {
    "id": "uuid",
    "name": "홍길동",
    "email": "hong@xem.com",
    "role": "STAFF"
  },
  "budgetItem": {
    "id": "uuid",
    "category": "필수사업비",
    "mainItem": "설계비",
    "subItem": "건축설계",
    "currentBudget": "2557500000",
    "executedAmount": "1994850000",
    "remainingBeforeExec": "562650000"
  },
  "executionType": "SPLIT",
  "totalAmount": "750000000",
  "actualAmount": "250000000",
  "nominalAmount": "500000000",
  "description": "11월 건축설계비 집행\n- 설계 변경 반영\n- 인허가 추가 비용",
  "purpose": "건축 설계 최종 납품",
  "status": "PENDING",
  "currentStep": 1,
  "totalSteps": 2,
  "requestedAt": "2024-11-19T09:00:00Z",
  "approvals": [
    {
      "id": "uuid",
      "step": 1,
      "approver": {
        "id": "uuid",
        "name": "김팀장",
        "role": "TEAM_LEAD"
      },
      "status": "PENDING",
      "comments": null,
      "createdAt": "2024-11-19T09:00:00Z"
    },
    {
      "id": "uuid",
      "step": 2,
      "approver": {
        "id": "uuid",
        "name": "이승인",
        "role": "APPROVER"
      },
      "status": "PENDING",
      "comments": null,
      "createdAt": "2024-11-19T09:00:00Z"
    }
  ]
}
```

---

### POST /execution

집행 요청 생성

**Request Body:**
```json
{
  "projectId": "uuid",
  "budgetItemId": "uuid",
  "executionType": "ACTUAL",
  "totalAmount": "10000000000",
  "actualAmount": "10000000000",
  "description": "토지 매입비 집행",
  "purpose": "토지 잔금 납부"
}
```

**Response (201 Created):**
```json
{
  "id": "new-uuid",
  "requestNumber": "EXE-2024-0025",
  "projectId": "uuid",
  "budgetItemId": "uuid",
  "executionType": "ACTUAL",
  "totalAmount": "10000000000",
  "status": "PENDING",
  "currentStep": 1,
  "totalSteps": 2,
  "requestedAt": "2024-11-19T10:00:00Z"
}
```

---

### POST /execution/:id/approve

집행 요청 승인

**Path Parameters:**
- `id`: 집행 요청 ID

**Request Body:**
```json
{
  "comments": "승인합니다."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "requestNumber": "EXE-2024-0001",
  "status": "APPROVED",
  "currentStep": 2,
  "completedAt": "2024-11-19T10:30:00Z",
  "approval": {
    "id": "uuid",
    "step": 2,
    "approverId": "uuid",
    "status": "APPROVED",
    "comments": "승인합니다.",
    "approvedAt": "2024-11-19T10:30:00Z"
  }
}
```

---

### POST /execution/:id/reject

집행 요청 반려

**Path Parameters:**
- `id`: 집행 요청 ID

**Request Body:**
```json
{
  "comments": "예산 초과로 반려합니다. 금액 조정 후 재요청 바랍니다."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "requestNumber": "EXE-2024-0001",
  "status": "REJECTED",
  "rejectedAt": "2024-11-19T10:30:00Z",
  "rejectionReason": "예산 초과로 반려합니다. 금액 조정 후 재요청 바랍니다."
}
```

---

### GET /execution/history

집행 히스토리 조회

**Query Parameters:**
- `projectId` (optional): 프로젝트 ID 필터
- `startDate` (optional): 시작일 (YYYY-MM-DD)
- `endDate` (optional): 종료일 (YYYY-MM-DD)
- `executionType` (optional): 집행 유형 필터

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "requestNumber": "EXE-2024-0015",
      "project": {
        "code": "PRJ-2024-001",
        "name": "강남 아파트 개발"
      },
      "budgetItem": {
        "mainItem": "공사비",
        "subItem": "직접공사비"
      },
      "executionType": "ACTUAL",
      "totalAmount": "5000000000",
      "status": "APPROVED",
      "requestedAt": "2024-11-10T10:00:00Z",
      "completedAt": "2024-11-11T14:30:00Z"
    }
  ],
  "summary": {
    "totalExecutions": 20,
    "totalAmount": "105000000000",
    "actualAmount": "67000000000",
    "nominalAmount": "38000000000"
  }
}
```

---

## 현금흐름 (Cash Flow)

### GET /financial/cashflow/:projectId

프로젝트 현금흐름 목록 조회

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Query Parameters:**
- `monthIndex` (optional): 월 인덱스 필터 (0-11)
- `type` (optional): 유형 필터 (INFLOW, OUTFLOW)
- `category` (optional): 카테고리 필터

**Response (200 OK):**
```json
{
  "projectId": "uuid",
  "items": [
    {
      "id": "uuid",
      "type": "OUTFLOW",
      "category": "필수사업비",
      "mainItem": "토지비",
      "subItem": "토지 매입비",
      "description": "강남 부지 매입",
      "budgetAmount": "3033854166.67",
      "forecastAmount": "3033854166.67",
      "actualAmount": "3033854166.67",
      "varianceAmount": "0",
      "varianceReason": null,
      "isVarianceApproved": false,
      "actualExecutionType": "ACTUAL",
      "actualExecutionAmount": "3033854166.67",
      "nominalExecutionAmount": "0",
      "executionNote": "토지 잔금 납부 완료",
      "monthIndex": 0,
      "plannedDate": "2024-01-15",
      "forecastDate": "2024-01-15",
      "actualDate": "2024-01-15"
    }
  ],
  "summary": {
    "totalBudgetInflow": "155000000000",
    "totalBudgetOutflow": "155000000000",
    "totalForecastInflow": "155000000000",
    "totalForecastOutflow": "155000000000",
    "totalActualInflow": "100000000000",
    "totalActualOutflow": "105000000000"
  }
}
```

---

### GET /financial/cashflow/:projectId/summary

현금흐름 요약 정보 조회

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Response (200 OK):**
```json
{
  "projectId": "uuid",
  "summary": {
    "planned": {
      "inflow": "155000000000",
      "outflow": "155000000000",
      "net": "0"
    },
    "forecast": {
      "inflow": "155000000000",
      "outflow": "155000000000",
      "net": "0"
    },
    "actual": {
      "inflow": "100000000000",
      "outflow": "105000000000",
      "net": "-5000000000"
    }
  },
  "monthlyData": [
    {
      "monthIndex": 0,
      "month": "2024-01",
      "budgetInflow": "12916666666.67",
      "budgetOutflow": "12916666666.67",
      "forecastInflow": "12916666666.67",
      "forecastOutflow": "13000000000.00",
      "actualInflow": "12916666666.67",
      "actualOutflow": "13200000000.00",
      "netBudget": "0",
      "netForecast": "-83333333.33",
      "netActual": "-283333333.33",
      "cumulativeCash": "-283333333.33"
    }
  ],
  "lowestCash": {
    "amount": "-15000000000",
    "month": 8,
    "date": "2024-09"
  }
}
```

---

### POST /financial/cashflow/:projectId

현금흐름 항목 생성

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Request Body:**
```json
{
  "type": "OUTFLOW",
  "category": "필수사업비",
  "mainItem": "기타비용",
  "subItem": "보험료",
  "budgetAmount": "50000000",
  "forecastAmount": "52000000",
  "actualAmount": "0",
  "monthIndex": 11,
  "plannedDate": "2024-12-15",
  "forecastDate": "2024-12-20",
  "isRecurring": true,
  "recurringMonths": 12
}
```

**Response (201 Created):**
```json
{
  "id": "new-uuid",
  "projectId": "uuid",
  "type": "OUTFLOW",
  "category": "필수사업비",
  "mainItem": "기타비용",
  "subItem": "보험료",
  "budgetAmount": "50000000",
  "forecastAmount": "52000000",
  "actualAmount": "0",
  "varianceAmount": "0",
  "monthIndex": 11,
  "plannedDate": "2024-12-15",
  "createdAt": "2024-11-19T10:00:00Z"
}
```

---

### PUT /financial/cashflow/:id

현금흐름 항목 수정

**Path Parameters:**
- `id`: 현금흐름 항목 ID

**Request Body:**
```json
{
  "actualAmount": "52500000",
  "actualDate": "2024-12-21",
  "varianceReason": "보험료 인상으로 인한 추가 지출",
  "actualExecutionType": "ACTUAL",
  "actualExecutionAmount": "52500000",
  "executionNote": "2024년 보험료 납부 완료"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "actualAmount": "52500000",
  "actualDate": "2024-12-21",
  "varianceAmount": "2500000",
  "varianceReason": "보험료 인상으로 인한 추가 지출",
  "actualExecutionType": "ACTUAL",
  "actualExecutionAmount": "52500000",
  "executionNote": "2024년 보험료 납부 완료",
  "updatedAt": "2024-11-19T10:30:00Z"
}
```

---

### DELETE /financial/cashflow/:id

현금흐름 항목 삭제

**Path Parameters:**
- `id`: 현금흐름 항목 ID

**Response (200 OK):**
```json
{
  "message": "Cash flow item deleted successfully"
}
```

---

### POST /financial/cashflow/:id/approve-variance

현금흐름 차이 승인

**Path Parameters:**
- `id`: 현금흐름 항목 ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "isVarianceApproved": true,
  "varianceAmount": "2500000",
  "varianceReason": "보험료 인상으로 인한 추가 지출",
  "updatedAt": "2024-11-19T10:30:00Z"
}
```

---

### GET /financial/cashflow/:projectId/export

현금흐름 Excel 내보내기

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Response (200 OK):**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename=cashflow_{projectId}_{date}.xlsx`

Excel 파일 다운로드

---

### GET /financial/cashflow/:projectId/analytics

현금흐름 분석 데이터

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Response (200 OK):**
```json
{
  "monthlyData": [
    {
      "month": "2024-01",
      "budgetNet": "0",
      "forecastNet": "-83333333.33",
      "actualNet": "-283333333.33",
      "cumulativeCash": "-283333333.33"
    }
  ],
  "statistics": {
    "totalItems": 372,
    "unapprovedVariances": 5,
    "lowestCash": "-15000000000",
    "highestCash": "25000000000"
  }
}
```

---

## 재무 분석 (Financial)

### GET /financial/model/:projectId

재무 모델 조회

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "modelName": "기본 시나리오",
  "totalRevenue": "155000000000",
  "totalCost": "155000000000",
  "expectedProfit": "0",
  "profitMargin": 0,
  "roi": 0,
  "npv": "-5000000000",
  "irr": 8.5,
  "paybackPeriod": 24,
  "lowestCashPoint": "-15000000000",
  "lowestCashMonth": 8,
  "assumptions": {
    "discountRate": 0.08,
    "inflationRate": 0.02,
    "salesRate": 0.95
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-11-19T10:00:00Z"
}
```

---

### POST /financial/simulate/:projectId

시나리오 시뮬레이션

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Request Body:**
```json
{
  "scenarioName": "낙관적 시나리오",
  "assumptions": {
    "salesPriceIncrease": 0.05,
    "constructionCostIncrease": -0.03,
    "financialCostDecrease": -0.02
  }
}
```

**Response (200 OK):**
```json
{
  "scenario": "낙관적 시나리오",
  "totalRevenue": "162750000000",
  "totalCost": "150350000000",
  "expectedProfit": "12400000000",
  "profitMargin": 8.24,
  "roi": 8.25,
  "npv": "5000000000",
  "irr": 12.5,
  "comparison": {
    "revenueDelta": "7750000000",
    "costDelta": "-4650000000",
    "profitDelta": "12400000000"
  }
}
```

---

## 승인 (Approvals)

### GET /approval/pending

승인 대기 목록 조회

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "executionRequest": {
        "id": "uuid",
        "requestNumber": "EXE-2024-0001",
        "requester": {
          "name": "홍길동",
          "role": "STAFF"
        },
        "budgetItem": {
          "mainItem": "설계비",
          "subItem": "건축설계"
        },
        "totalAmount": "750000000",
        "description": "11월 건축설계비 집행"
      },
      "step": 1,
      "status": "PENDING",
      "createdAt": "2024-11-19T09:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "byStep": {
      "1": 3,
      "2": 2
    }
  }
}
```

---

### GET /approval/:id

승인 상세 조회

**Path Parameters:**
- `id`: 승인 ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "executionRequest": {
    "id": "uuid",
    "requestNumber": "EXE-2024-0001",
    "project": {
      "code": "PRJ-2024-001",
      "name": "강남 아파트 개발"
    },
    "requester": {
      "name": "홍길동",
      "email": "hong@xem.com",
      "department": "사업팀"
    },
    "budgetItem": {
      "category": "필수사업비",
      "mainItem": "설계비",
      "subItem": "건축설계",
      "currentBudget": "2557500000",
      "remainingBeforeExec": "562650000"
    },
    "executionType": "SPLIT",
    "totalAmount": "750000000",
    "actualAmount": "250000000",
    "nominalAmount": "500000000",
    "description": "11월 건축설계비 집행",
    "requestedAt": "2024-11-19T09:00:00Z"
  },
  "step": 1,
  "status": "PENDING",
  "comments": null,
  "createdAt": "2024-11-19T09:00:00Z"
}
```

---

### POST /approval/:id/approve

승인 처리

**Path Parameters:**
- `id`: 승인 ID

**Request Body:**
```json
{
  "comments": "검토 완료. 승인합니다."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "comments": "검토 완료. 승인합니다.",
  "approvedAt": "2024-11-19T10:30:00Z",
  "executionRequest": {
    "id": "uuid",
    "status": "PENDING",
    "currentStep": 2
  }
}
```

---

### POST /approval/:id/reject

승인 반려

**Path Parameters:**
- `id`: 승인 ID

**Request Body:**
```json
{
  "comments": "예산 초과로 반려합니다."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "comments": "예산 초과로 반려합니다.",
  "rejectedAt": "2024-11-19T10:30:00Z",
  "executionRequest": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

---

### GET /approval/history

승인 히스토리 조회

**Query Parameters:**
- `startDate` (optional): 시작일
- `endDate` (optional): 종료일
- `status` (optional): 상태 필터

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "executionRequest": {
        "requestNumber": "EXE-2024-0015",
        "totalAmount": "5000000000"
      },
      "step": 2,
      "status": "APPROVED",
      "comments": "승인 완료",
      "approvedAt": "2024-11-15T14:30:00Z"
    }
  ],
  "summary": {
    "totalApprovals": 50,
    "approved": 45,
    "rejected": 5,
    "averageApprovalTime": "4.5 hours"
  }
}
```

---

## 분석 (Analytics)

### GET /analytics/dashboard/:projectId

대시보드 데이터 조회

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Response (200 OK):**
```json
{
  "project": {
    "id": "uuid",
    "code": "PRJ-2024-001",
    "name": "강남 아파트 개발",
    "status": "IN_PROGRESS"
  },
  "budget": {
    "totalBudget": "157925000000",
    "totalExecuted": "105000000000",
    "totalRemaining": "52925000000",
    "executionRate": 66.5
  },
  "cashFlow": {
    "currentCash": "-5000000000",
    "lowestCash": "-15000000000",
    "lowestCashMonth": 8
  },
  "executions": {
    "pending": 5,
    "approved": 45,
    "rejected": 3,
    "totalAmount": "105000000000"
  },
  "recentActivities": [
    {
      "type": "EXECUTION_APPROVED",
      "description": "EXE-2024-0020 승인 완료",
      "timestamp": "2024-11-19T10:00:00Z"
    }
  ]
}
```

---

### GET /analytics/budget-execution/:projectId

예산집행 통계

**Path Parameters:**
- `projectId`: 프로젝트 ID

**Response (200 OK):**
```json
{
  "byCategory": [
    {
      "category": "필수사업비",
      "mainItem": "토지비",
      "budget": "38246250000",
      "executed": "36333937500",
      "rate": 95
    }
  ],
  "byMonth": [
    {
      "month": "2024-01",
      "executed": "13200000000",
      "cumulative": "13200000000"
    }
  ],
  "executionTypes": {
    "ACTUAL": "67000000000",
    "NOMINAL": "38000000000",
    "SPLIT": "0"
  }
}
```

---

## 에러 응답

### 공통 에러 형식

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-11-19T10:00:00Z",
  "path": "/auth/register"
}
```

### HTTP 상태 코드

- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 중복 데이터
- `500 Internal Server Error`: 서버 오류

---

## Rate Limiting

API 호출 제한: **100 requests/minute per IP**

초과 시 응답:
```json
{
  "statusCode": 429,
  "message": "Too many requests"
}
```

---

## Webhook (추후 지원 예정)

집행 승인/반려 시 외부 시스템으로 알림 전송

---

**최종 업데이트**: 2024-11-19
**API 버전**: v1
