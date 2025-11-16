# XEM 시스템 워크플로우 종합 검증 리포트

**검증일**: 2025-11-16
**검증 방법**: 담당자 Agent & 승인권자 Agent 병렬 분석
**대상**: XEM System v3.1 승인 워크플로우

---

## 📋 Executive Summary

### 🔴 **치명적 발견**: 시스템 미작동

담당자 Agent 분석 결과, **DTO 불일치로 인해 집행요청 생성이 작동하지 않음**을 확인했습니다.

```
현재 상태: ❌ CRITICAL FAILURE
담당자가 집행요청을 생성할 수 없습니다.
```

### 전체 평가 점수

| 관점 | 점수 | 상태 |
|------|------|------|
| **담당자 워크플로우** | 5.0/10 | 🔴 시스템 미작동 |
| **승인권자 워크플로우** | 7.7/10 | 🟡 개선 필요 |
| **종합 평가** | **6.4/10** | **🔴 즉시 수정 필요** |

---

## 1. 담당자 Agent 분석 결과

### 1.1 발견된 치명적 이슈

#### 🔴 이슈 #1: DTO와 실제 데이터 구조 완전 불일치

**위치**: `backend/src/execution/dto/create-execution-request.dto.ts`

**현재 상황**:

**DTO가 요구하는 필드**:
```typescript
export class CreateExecutionRequestDto {
  projectId: string;           // ✓
  budgetItemId: string;        // ✓
  amount: number;              // ✓
  description: string;         // ✓ 필수
  requestReason: string;       // ✓ 필수 ❌ 프론트엔드 안 보냄
  attachmentUrl?: string;      // ○ 선택
  // ❌ executionDate 없음
  // ❌ purpose 없음
}
```

**프론트엔드가 실제로 보내는 데이터**:
```typescript
// ExecutionsPage.tsx Line 209-216
{
  projectId,              // ✓
  budgetItemId,           // ✓
  amount,                 // ✓
  executionDate,          // ❌ DTO에 없음 → 422 에러
  purpose,                // ❌ DTO에 없음 → 422 에러
  description,            // ✓ (하지만 optional)
  // ❌ requestReason 없음 → 422 에러
}
```

**백엔드 서비스가 사용하는 필드**:
```typescript
// execution.service.ts Line 84, 111-114
const {
  projectId,
  budgetItemId,
  amount,
  executionDate,    // ❌ DTO 통과 못함
  purpose,          // ❌ DTO 통과 못함
  description,      // ✓
  attachments       // ❌ DTO에 없음
} = data;
```

**결과**:
- 💥 **시스템이 작동하지 않습니다**
- 담당자가 집행요청을 생성하면 422 Unprocessable Entity 에러 발생
- ValidationPipe가 DTO 검증에서 요청을 차단

**영향도**: 🔴 **CRITICAL** - 핵심 기능 완전 마비

---

#### 🔴 이슈 #2: 자기 승인 워크플로우 설계 결함

**위치**: `backend/src/execution/execution.service.ts` Line 121-126

**문제**:
```typescript
const approvalSteps = [
  { step: 1, approverRole: 'STAFF' },      // ← 담당자가 승인자
  { step: 2, approverRole: 'TEAM_LEAD' },
  { step: 3, approverRole: 'RM_TEAM' },
  { step: 4, approverRole: 'CFO' },
];
```

- 요청 생성자: **STAFF** (담당자)
- Step 1 승인자: **STAFF** (담당자)
- **결과**: 담당자가 자신의 요청을 스스로 승인하는 구조

**내부 통제 관점**:
- ❌ 4 Eyes Principle 위배
- ❌ Segregation of Duties 위배
- ❌ 감사 리스크

**영향도**: 🔴 **HIGH** - 내부 통제 실패

---

### 1.2 기타 발견 이슈

#### 이슈 #3: Race Condition - 동시성 제어 부재
- **위치**: `execution.service.ts` Line 87-98
- **문제**: 여러 담당자가 동시에 같은 예산 항목에서 요청 생성 시 예산 초과 가능
- **완화책**: 최종 승인 시 트랜잭션 내 재검증 존재
- **영향도**: 🟡 **MEDIUM**

#### 이슈 #4: 프론트엔드 입력 검증 부재
- **위치**: `frontend/src/pages/ExecutionsPage.tsx`
- **문제**:
  - 잔액 초과 금액 입력 가능
  - 과거 날짜 선택 가능
  - 실시간 피드백 없음
- **영향도**: 🟡 **MEDIUM** - UX 저하

#### 이슈 #5: Update API 보안 취약점
- **위치**: `execution.service.ts` Line 142-152
- **문제**: `data: any` 타입으로 모든 필드 업데이트 가능
- **리스크**: status, amount, requestedById 변경 가능
- **영향도**: 🟡 **MEDIUM** - 보안 취약점

---

## 2. 승인권자 Agent 분석 결과

### 2.1 보안 이슈

#### 이슈 #6: Controller 레벨 권한 검증 부재
- **위치**: `approval/approval.controller.ts`
- **문제**: `RolesGuard`가 적용되지 않아 인증만 되면 모든 사용자가 API 호출 가능
- **현재 방어**: Service 레벨 검증만 존재
- **영향도**: 🟡 **MEDIUM** - Defense in Depth 원칙 위배

---

### 2.2 데이터 무결성 이슈

#### 이슈 #7: 프로젝트 총계 계산 불일치
- **위치**: `approval/approval.service.ts`
- **문제**:
  - `approve()` 메서드: `isActive` 필터 없음 (Line 152)
  - `updateProjectTotals()` 메서드: `isActive: true` 필터 적용 (Line 259)
- **결과**: 비활성 예산 항목 있을 시 프로젝트 총계 부정확
- **영향도**: 🔴 **HIGH** - 재무 데이터 정확성 영향

#### 이슈 #8: 예산 검증이 최종 단계에만 실행
- **위치**: `approval/approval.service.ts` Line 96-111
- **문제**: CFO(Step 4) 승인 시에만 예산 재검증
- **시나리오**:
  ```
  1. 요청 생성 시 잔액 충분
  2. Step 1~3 승인 진행
  3. 다른 요청이 먼저 집행되어 잔액 감소
  4. Step 4 승인 시 "예산 부족" 에러
  → Step 1~3 승인이 낭비됨
  ```
- **영향도**: 🟡 **MEDIUM** - 비효율적 프로세스

---

### 2.3 워크플로우 로직 이슈

#### 이슈 #9: getPendingApprovals가 미래 단계 승인 건 포함
- **위치**: `approval/approval.service.ts` Line 20-24
- **문제**: `currentStep` 필터 없어서 미래 단계 승인 건도 조회됨
- **사용자 경험**:
  ```
  1. RM_TEAM 역할로 로그인
  2. Step 2인 요청의 Step 3 승인 건이 목록에 표시
  3. 승인 시도 → "현재 단계가 아님" 에러
  4. 사용자 혼란: "왜 목록에 있는데 승인 안되지?"
  ```
- **영향도**: 🟡 **MEDIUM** - UX 저하

#### 이슈 #10: reject() 메서드의 currentStep 검증 누락
- **위치**: `approval/approval.service.ts` Line 193-255
- **문제**: approve()는 currentStep 검증 있지만, reject()는 없음
- **영향도**: 🟢 **LOW** - 일관성 부족

#### 이슈 #11: Frontend 워크플로우 하드코딩
- **위치**: `frontend/src/pages/ApprovalsPage.tsx` Line 221
- **문제**: 4단계 워크플로우가 하드코딩됨
- **영향도**: 🟢 **LOW** - 확장성 부족

#### 이슈 #12: SKIPPED 승인의 감사 추적 부족
- **위치**: `approval/approval.service.ts` Line 230-241
- **문제**: SKIPPED된 승인이 누구에 의해 생략되었는지 기록 안됨
- **영향도**: 🟢 **LOW** - 감사 기능 약화

---

## 3. 워크플로우 단계별 평가

### Step 1: STAFF (담당자 확인)

| 항목 | 상태 | 비고 |
|------|------|------|
| 요청 생성 | 🔴 **FAIL** | DTO 불일치로 미작동 |
| 역할 검증 | ✅ **PASS** | Service 레벨 검증 정상 |
| 자기 승인 방지 | 🔴 **FAIL** | 담당자가 자신의 요청 승인 가능 |
| 예산 검증 | ❌ **SKIP** | 중간 단계는 검증 없음 |

**평가**: 🔴 **2.5/10** - 시스템 미작동

---

### Step 2: TEAM_LEAD (팀장 승인)

| 항목 | 상태 | 비고 |
|------|------|------|
| 역할 검증 | ✅ **PASS** | ForbiddenException 정상 |
| 단계 검증 | ✅ **PASS** | currentStep 일치 확인 |
| 트랜잭션 | ✅ **PASS** | 원자성 보장 |
| 목록 필터링 | 🟡 **WARN** | 미래 단계 승인 건 표시됨 |
| 예산 정보 | ❌ **SKIP** | 예산 상태 알 수 없음 |

**평가**: 🟡 **7.0/10** - 기능은 정상, UX 개선 필요

---

### Step 3: RM_TEAM (RM팀 승인)

| 항목 | 상태 | 비고 |
|------|------|------|
| 역할 검증 | ✅ **PASS** | 정상 작동 |
| 단계 검증 | ✅ **PASS** | 정상 작동 |
| 트랜잭션 | ✅ **PASS** | 원자성 보장 |
| 목록 필터링 | 🟡 **WARN** | 미래 단계 승인 건 표시됨 |
| 예산 정보 | ❌ **SKIP** | 예산 상태 알 수 없음 |

**평가**: 🟡 **7.0/10** - 기능은 정상, UX 개선 필요

---

### Step 4: CFO (최종 승인)

| 항목 | 상태 | 비고 |
|------|------|------|
| 역할 검증 | ✅ **PASS** | 정상 작동 |
| 단계 검증 | ✅ **PASS** | 정상 작동 |
| 예산 재검증 | ✅ **PASS** | 트랜잭션 내 검증 |
| 원자적 업데이트 | ✅ **PASS** | ExecutionRequest + BudgetItem + Project |
| 집행률 계산 | ⚠️ **PARTIAL** | 계산은 되나 isActive 불일치 가능 |

**평가**: ✅ **8.5/10** - 가장 안정적인 단계

---

## 4. 우선순위별 수정 계획

### 🔴 P0 (Critical) - 즉시 수정 필요 (1-2일)

#### 수정 #1: DTO 불일치 해결
**파일**: `backend/src/execution/dto/create-execution-request.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateExecutionRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;

  @IsString()
  @IsNotEmpty({ message: 'Budget item ID is required' })
  budgetItemId: string;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @IsDateString({}, { message: 'Invalid execution date format' })
  @IsNotEmpty({ message: 'Execution date is required' })
  executionDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Purpose is required' })
  @MaxLength(500, { message: 'Purpose must not exceed 500 characters' })
  purpose: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}
```

**예상 소요 시간**: 30분

---

#### 수정 #2: 자기 승인 워크플로우 수정
**파일**: `backend/src/execution/execution.service.ts`

**옵션 A: 3단계 승인으로 변경 (권장)**
```typescript
const approvalSteps = [
  { step: 1, approverRole: 'TEAM_LEAD' },  // 팀장 승인
  { step: 2, approverRole: 'RM_TEAM' },    // RM팀 승인
  { step: 3, approverRole: 'CFO' },        // CFO 최종 승인
];
```

**옵션 B: DRAFT 상태 추가**
```typescript
// 요청 생성 시 DRAFT 상태
status: 'DRAFT',

// 별도 API로 제출
async submit(id: string, userId: string) {
  // ...
  status: 'PENDING',
  currentStep: 1,
  approvalSteps: [
    { step: 1, approverRole: 'TEAM_LEAD' },
    // ...
  ]
}
```

**예상 소요 시간**: 1-2시간

---

### 🔴 P1 (High) - 1주일 이내

#### 수정 #3: 프로젝트 총계 계산 일관성 확보
**파일**: `backend/src/approval/approval.service.ts`

```typescript
// Line 152: approve() 메서드에 isActive 필터 추가
const budgetItems = await tx.budgetItem.findMany({
  where: {
    projectId: executionRequest.projectId,
    isActive: true,  // ← 추가
  },
});
```

**예상 소요 시간**: 15분

---

#### 수정 #4: getPendingApprovals 필터링 개선
**파일**: `backend/src/approval/approval.service.ts`

```typescript
// Line 20-24: currentStep 필터 추가
const approvals = await this.prisma.approval.findMany({
  where: {
    approverRole: user.role,
    status: 'PENDING',
    executionRequest: {
      currentStep: {
        equals: this.prisma.$queryRaw`approval.step`,  // Prisma 제약으로 인해 복잡
      },
    },
  },
  include: {
    executionRequest: {
      include: {
        project: true,
        budgetItem: true,
        requestedBy: true,
      },
    },
  },
});

// 또는 JavaScript 필터링
return approvals.filter(approval =>
  approval.executionRequest.currentStep === approval.step
);
```

**예상 소요 시간**: 30분

---

#### 수정 #5: Controller 레벨 권한 검증 추가
**파일**: `backend/src/approval/approval.controller.ts`

```typescript
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('approval')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← RolesGuard 추가
@Roles(
  UserRole.STAFF,
  UserRole.TEAM_LEAD,
  UserRole.RM_TEAM,
  UserRole.CFO
)  // ← 허용 역할 명시
export class ApprovalController {
  // ...
}
```

**예상 소요 시간**: 15분

---

#### 수정 #6: 프론트엔드 입력 검증 추가
**파일**: `frontend/src/pages/ExecutionsPage.tsx`

```typescript
// 실시간 금액 검증
const [amountError, setAmountError] = useState('');

const handleAmountChange = (value: string) => {
  setAmount(value);
  const numValue = parseFloat(value);

  if (!selectedBudgetItem) return;

  if (numValue <= 0) {
    setAmountError('Amount must be greater than 0');
  } else if (numValue > selectedBudgetItem.remainingBudget) {
    setAmountError(
      `Amount exceeds available budget (${formatCurrency(selectedBudgetItem.remainingBudget)})`
    );
  } else {
    setAmountError('');
  }
};

// 날짜 검증
<input
  type="date"
  min={new Date().toISOString().split('T')[0]}
  // ...
/>

// 제출 버튼 비활성화
<button
  disabled={!!amountError || !amount || !purpose}
>
  Create Request
</button>
```

**예상 소요 시간**: 1시간

---

### 🟡 P2 (Medium) - 2주일 이내

#### 수정 #7: Update API 보안 강화
**파일**: `backend/src/execution/execution.service.ts`

```typescript
async update(id: string, data: UpdateExecutionRequestDto, userId: string) {
  const execution = await this.findOne(id);

  // 권한 검증
  if (execution.requestedById !== userId) {
    throw new ForbiddenException('Only requester can update');
  }

  // 상태 검증
  if (execution.status !== 'PENDING' && execution.status !== 'DRAFT') {
    throw new BadRequestException('Cannot update non-pending request');
  }

  // 허용된 필드만 업데이트
  const { purpose, description, executionDate, attachments } = data;

  return this.prisma.executionRequest.update({
    where: { id },
    data: {
      purpose,
      description,
      executionDate: executionDate ? new Date(executionDate) : undefined,
      attachments,
      updatedAt: new Date(),
    },
  });
}
```

**예상 소요 시간**: 1시간

---

#### 수정 #8: reject()에 currentStep 검증 추가
**파일**: `backend/src/approval/approval.service.ts`

```typescript
// Line 211 이후 추가
// Validation: Check if this approval is the current step
const executionRequest = approval.executionRequest;
if (approval.step !== executionRequest.currentStep) {
  throw new BadRequestException(
    `This approval is step ${approval.step}, but current step is ${executionRequest.currentStep}`
  );
}
```

**예상 소요 시간**: 15분

---

#### 수정 #9: 중간 단계 예산 상태 표시 (UX 개선)
**파일**: `frontend/src/pages/ApprovalsPage.tsx`

```typescript
// 승인 상세 정보에 예산 상태 추가
<div className="budget-status">
  <h4>Budget Status</h4>
  <p>Requested Amount: {formatCurrency(approval.executionRequest.amount)}</p>
  <p>
    Available Budget: {formatCurrency(approval.executionRequest.budgetItem.remainingBudget)}
  </p>
  {approval.executionRequest.amount > approval.executionRequest.budgetItem.remainingBudget && (
    <div className="warning">
      ⚠️ Warning: Insufficient budget at final approval
    </div>
  )}
</div>
```

**예상 소요 시간**: 30분

---

### 🟢 P3 (Low) - 추후 검토

- 이슈 #11: Frontend 워크플로우 동적화
- 이슈 #12: SKIPPED 감사 추적 개선
- 이슈 #3: Race Condition 개선 (현재 완화책 존재)

---

## 5. 테스트 계획

### 5.1 수정 후 필수 테스트

#### 테스트 #1: DTO 수정 검증
```bash
# Backend 테스트
curl -X POST http://localhost:3000/api/execution \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "budgetItemId": "...",
    "amount": 1000000,
    "executionDate": "2025-12-01",
    "purpose": "Test purpose",
    "description": "Test description"
  }'

# 예상 결과: 200 OK (현재는 422 에러)
```

#### 테스트 #2: 워크플로우 수정 검증
```
시나리오:
1. STAFF가 요청 생성
2. 상태 확인: status=PENDING, currentStep=1
3. TEAM_LEAD가 Step 1 승인 (이전: STAFF 승인)
4. 상태 확인: currentStep=2
5. RM_TEAM이 Step 2 승인
6. 상태 확인: currentStep=3
7. CFO가 Step 3 승인
8. 상태 확인: status=APPROVED

예상 결과: ✅ 정상 승인, 자기 승인 방지됨
```

#### 테스트 #3: getPendingApprovals 필터링
```
시나리오:
1. ExecutionRequest 생성 (currentStep=1)
2. TEAM_LEAD로 로그인 (Step 1 승인자)
3. GET /approval/pending 호출
4. 결과 확인: Step 1 승인 건만 표시되는지 확인

예상 결과: Step 2, 3 승인 건은 표시 안됨
```

#### 테스트 #4: 프로젝트 총계 정확성
```
시나리오:
1. 프로젝트에 활성/비활성 예산 항목 존재
2. 집행요청 최종 승인
3. Project.executedAmount 확인
4. 활성 예산 항목만 합산되었는지 검증

예상 결과: 활성 항목만 집계됨
```

---

### 5.2 회귀 테스트

- [ ] 기존 승인 프로세스 정상 작동
- [ ] 반려 프로세스 정상 작동
- [ ] 예산 초과 승인 차단
- [ ] 권한 없는 사용자 승인 차단
- [ ] 트랜잭션 롤백 정상 작동

---

## 6. 배포 전 체크리스트

### Backend

- [ ] DTO 수정 완료 및 테스트
- [ ] 승인 워크플로우 단계 수정
- [ ] isActive 필터 일관성 확보
- [ ] getPendingApprovals 필터링 개선
- [ ] Controller RolesGuard 추가
- [ ] Update API 보안 강화
- [ ] reject() currentStep 검증 추가
- [ ] 단위 테스트 작성
- [ ] Prisma migration 생성

### Frontend

- [ ] 입력 검증 추가
- [ ] 실시간 피드백 구현
- [ ] 날짜 검증 추가
- [ ] 예산 상태 표시 개선
- [ ] 에러 처리 개선 (Toast)
- [ ] E2E 테스트 작성

### Database

- [ ] 기존 데이터 마이그레이션 계획
- [ ] Approval step 재조정 (4단계 → 3단계)
- [ ] 백업 생성

---

## 7. 예상 작업 시간

| 우선순위 | 작업 항목 | 예상 시간 |
|---------|-----------|-----------|
| **P0** | DTO 수정 | 30분 |
| **P0** | 워크플로우 수정 | 1-2시간 |
| **P1** | isActive 필터 일관성 | 15분 |
| **P1** | getPendingApprovals 개선 | 30분 |
| **P1** | Controller 권한 검증 | 15분 |
| **P1** | 프론트엔드 검증 추가 | 1시간 |
| **P2** | Update API 보안 | 1시간 |
| **P2** | reject() 검증 추가 | 15분 |
| **P2** | 예산 상태 표시 | 30분 |
| **테스트** | 단위/통합 테스트 | 2-3시간 |
| **문서** | 변경사항 문서화 | 1시간 |
| **총계** | | **7-10시간** |

---

## 8. 결론 및 권장사항

### 8.1 현재 상태 평가

```
시스템 상태: 🔴 CRITICAL
- 담당자가 집행요청을 생성할 수 없음 (DTO 불일치)
- 자기 승인 가능 (내부 통제 실패)
- 데이터 계산 불일치 가능성 (isActive 필터)
```

### 8.2 즉시 조치 필요 (오늘 중)

1. **DTO 수정** (30분)
   - CreateExecutionRequestDto를 실제 사용 필드에 맞춤
   - 시스템 작동 가능하게 만듦

2. **워크플로우 수정** (1-2시간)
   - 3단계 승인으로 변경
   - 자기 승인 방지

### 8.3 단기 개선 (1주일)

3. **데이터 무결성 확보**
   - isActive 필터 일관성
   - getPendingApprovals 필터링
   - Controller 권한 검증

4. **UX 개선**
   - 프론트엔드 입력 검증
   - 실시간 피드백

### 8.4 장기 개선 (1개월)

5. **보안 강화**
   - Update API 보안
   - 감사 추적 개선

6. **기능 확장**
   - DRAFT 상태 추가
   - 워크플로우 동적화
   - 알림 시스템

### 8.5 최종 의견

XEM 시스템의 승인 워크플로우는 **기본 구조는 우수하지만 치명적 결함**이 있습니다:

**긍정적 측면**:
- ✅ 트랜잭션 처리 우수
- ✅ Service 레벨 권한 검증 철저
- ✅ 반려 프로세스 완벽
- ✅ 최종 예산 검증 수행

**치명적 문제**:
- 🔴 DTO 불일치로 시스템 미작동
- 🔴 자기 승인 가능 (내부 통제 실패)
- 🔴 데이터 계산 불일치 가능성

**즉시 DTO와 워크플로우를 수정해야만** 시스템을 사용할 수 있습니다.

다행히 수정 작업은 비교적 간단하며(7-10시간), 백엔드 구조가 잘 설계되어 있어 추가 개선도 용이합니다.

---

## 9. 에이전트 분석 요약

### 담당자 Agent 평가
- **기능 완성도**: 2/10 (시스템 미작동)
- **사용 편의성**: 6/10 (UI는 좋으나 검증 부족)
- **오류 처리**: 5/10 (백엔드 양호, 프론트엔드 미흡)
- **데이터 안정성**: 7/10 (트랜잭션 양호, 동시성 이슈)
- **보안**: 4/10 (자기 승인, Update API 취약)
- **확장성**: 6/10 (구조는 좋으나 기능 부족)
- **평균**: **5.0/10**

### 승인권자 Agent 평가
- **권한 검증**: 7/10 (Service 레벨 철저, Controller 부족)
- **트랜잭션 안정성**: 9/10 (우수)
- **워크플로우 완결성**: 7/10 (기능 정상, UX 개선 필요)
- **평균**: **7.7/10**

### 종합 평가
- **워크플로우 설계**: 7/10
- **구현 완성도**: 3/10 (DTO 불일치)
- **보안**: 6/10
- **사용성**: 6/10
- **안정성**: 8/10
- **종합**: **6.4/10**

---

**분석 완료**: 2025-11-16
**분석 방법**: 담당자 Agent & 승인권자 Agent 병렬 분석
**총 발견 이슈**: 12개 (Critical: 2, High: 5, Medium: 4, Low: 1)
**예상 수정 시간**: 7-10시간
