# 집행 요청 생성 문제 디버깅 가이드

## 📋 요약

**백엔드 API 상태**: ✅ **정상 작동 확인됨**

테스트 결과:
- 프로젝트 조회: ✅ 성공
- 예산 항목 조회: ✅ 성공
- 집행 요청 생성: ✅ 성공 (EXE-2025-0008 생성 확인)
- 집행 요청 목록 확인: ✅ 성공

**결론**: 백엔드는 문제없이 작동하고 있으므로, 프론트엔드에서 발생하는 문제일 가능성이 높습니다.

---

## 🔍 프론트엔드 디버깅 단계

### 1️⃣ 브라우저 개발자 도구 열기

1. 브라우저에서 **F12** 키를 누르거나 우클릭 → "검사" 선택
2. **Console** 탭과 **Network** 탭을 확인

### 2️⃣ Console 탭 확인

**체크 사항**:
- 페이지 로드 시 빨간색 에러 메시지가 있는가?
- "집행 요청 제출" 버튼 클릭 시 에러 메시지가 나타나는가?
- `Failed to create execution request` 같은 메시지가 있는가?

**가능한 에러**:
```
❌ Network Error
❌ 401 Unauthorized
❌ Failed to create execution request
❌ Cannot read property 'xxx' of undefined
```

### 3️⃣ Network 탭 확인

**체크 사항**:
1. Network 탭을 열고 **XHR** 또는 **Fetch** 필터 선택
2. "집행 요청 제출" 버튼 클릭
3. `/api/execution` POST 요청이 발생하는지 확인

**시나리오 A**: POST 요청이 **발생하지 않음**
- 원인: 프론트엔드 유효성 검사에서 차단됨
- 해결 방법: → 4️⃣ 단계로 이동

**시나리오 B**: POST 요청이 **발생하지만 실패함**
- 요청을 클릭하고 다음 확인:
  - **Status Code**: 200이 아닌 경우 (예: 400, 401, 500)
  - **Response** 탭에서 에러 메시지 확인
  - **Headers** 탭에서 Authorization 헤더 확인

**시나리오 C**: POST 요청이 **성공함 (200 OK)**
- 원인: 요청은 성공했지만 UI 업데이트 또는 리다이렉션 실패
- 해결 방법: → 5️⃣ 단계로 이동

### 4️⃣ 필수 입력 항목 확인

집행 요청 생성 폼의 모든 필수 항목이 입력되었는지 확인:

```
✓ 프로젝트 선택
✓ 예산 항목 선택
✓ 집행 금액 입력
✓ 집행 예정일 입력
✓ 집행 사유 입력
```

**현재 코드 로직** ([ExecutionRequestCreatePage.tsx:123-126](xem-system/frontend/src/pages/ExecutionRequestCreatePage.tsx#L123-L126)):
```typescript
if (!selectedProject || !selectedBudgetItem || !amount || !executionDate || !purpose) {
  alert('필수 항목을 모두 입력해주세요.');
  return;
}
```

**확인 방법**:
- 각 항목을 하나씩 입력하고 제출 버튼 클릭
- 어느 항목이 누락되었을 때 alert이 뜨는지 확인

### 5️⃣ 예산 부족 시나리오 확인

집행 금액이 예산 잔액을 초과하는 경우 특별한 처리가 필요합니다.

**현재 코드 로직** ([ExecutionRequestCreatePage.tsx:128-137](xem-system/frontend/src/pages/ExecutionRequestCreatePage.tsx#L128-L137)):
```typescript
// 예산 부족 시 전용 시나리오 선택 확인
if (assistance && !assistance.isSufficient) {
  if (selectedTransferScenario === null) {
    alert('예산이 부족합니다. 전용 시나리오를 선택해주세요.');
    return;
  }
  createExecutionMutation.mutate(true);
} else {
  createExecutionMutation.mutate(false);
}
```

**확인 방법**:
1. "💡 예산 가용성 확인" 버튼을 클릭했는가?
2. 예산이 부족하다고 표시되었는가?
3. 전용 시나리오를 선택했는가?

**해결 방법**:
- 예산 잔액보다 적은 금액으로 집행 요청 생성 시도
- 또는 예산 부족 시 전용 시나리오를 선택

### 6️⃣ 인증 토큰 확인

**확인 방법**:
1. 개발자 도구 → **Application** 탭 (또는 **Storage** 탭)
2. 왼쪽 메뉴에서 **Local Storage** 선택
3. `http://localhost:5175` 또는 해당 도메인 선택
4. `xem_token` 키가 있는지 확인

**문제 해결**:
- `xem_token`이 없는 경우: 로그아웃 후 다시 로그인
- 토큰이 있지만 요청 실패: 토큰이 만료되었을 수 있음

---

## 🧪 수동 테스트 절차

브라우저에서 직접 테스트하는 단계:

### Step 1: 로그인
1. `http://localhost:5175/login` 접속
2. 계정 정보 입력:
   - Email: `staff1@xem.com`
   - Password: `password123`
3. 로그인 버튼 클릭
4. 대시보드로 이동 확인

### Step 2: 집행 요청 페이지 접근
1. 왼쪽 메뉴에서 **집행** 클릭
2. **New Request** 버튼 클릭
3. URL이 `/executions/new`인지 확인

### Step 3: 폼 작성
1. **프로젝트** 드롭다운에서 "PRJ-2024-003 - 송도 주상복합" 선택
   - 드롭다운에 프로젝트가 보이는가? ✓

2. **예산 항목** 드롭다운에서 항목 선택 (예: "운영비 - 수도료")
   - 드롭다운에 예산 항목이 보이는가? ✓
   - 잔액이 표시되는가? ✓

3. **집행 금액** 입력: `500000`

4. **집행 예정일** 선택: 오늘 날짜 또는 미래 날짜

5. **집행 사유** 입력: `수도 요금 납부`

6. **상세 설명** (선택): `테스트용 집행 요청`

### Step 4: 예산 가용성 확인 (선택)
1. "💡 예산 가용성 확인" 버튼 클릭
2. 예산 분석 결과 확인:
   - ✅ 예산 충분 → 바로 제출 가능
   - ⚠️ 예산 부족 → 전용 시나리오 선택 필요

### Step 5: 제출
1. "집행 요청 제출" 버튼 클릭
2. 다음 중 하나가 발생하는지 확인:
   - ✅ "집행 요청이 생성되었습니다" alert 표시
   - ✅ `/executions` 페이지로 리다이렉션
   - ❌ 에러 메시지 표시
   - ❌ 아무 반응 없음 ← **문제 발생 지점**

### Step 6: 결과 확인
1. `/executions` 페이지에서 방금 생성한 요청 확인
2. 요청 번호, 금액, 상태 확인

---

## ⚙️ 가능한 문제 원인 및 해결 방법

### 문제 1: 프로젝트 드롭다운이 비어있음
**원인**: 이미 수정됨 (2025-11-17)
**해결**: 다음 코드로 수정 완료 ([ExecutionRequestCreatePage.tsx:35](xem-system/frontend/src/pages/ExecutionRequestCreatePage.tsx#L35))
```typescript
const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
```

### 문제 2: 예산 항목 드롭다운이 비어있음
**원인**: 이미 수정됨 (2025-11-17)
**해결**: 다음 코드로 수정 완료 ([ExecutionRequestCreatePage.tsx:48-56](xem-system/frontend/src/pages/ExecutionRequestCreatePage.tsx#L48-L56))
```typescript
const budgetItems: any[] = [];
if (budgetItemsData?.summary && Array.isArray(budgetItemsData.summary)) {
  budgetItemsData.summary.forEach((category: any) => {
    if (category.items && Array.isArray(category.items)) {
      budgetItems.push(...category.items);
    }
  });
}
```

### 문제 3: 401 Unauthorized 에러
**원인**: JWT 토큰이 없거나 만료됨
**해결**:
1. 로그아웃 후 다시 로그인
2. Local Storage에서 `xem_token` 확인
3. 필요시 토큰 수동 삭제 후 재로그인

### 문제 4: CORS 에러
**원인**: 프론트엔드(localhost:5175)와 백엔드(localhost:3000) 간 CORS 설정 문제
**해결**: 백엔드에 CORS가 이미 설정되어 있으므로 발생하지 않아야 함
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:5175',
  credentials: true,
});
```

### 문제 5: 버튼이 비활성화됨
**원인**: `createExecutionMutation.isPending`이 true
**확인**: 버튼 텍스트가 "제출 중..."인지 확인
**해결**: 페이지 새로고침 후 다시 시도

### 문제 6: 네트워크 연결 끊김
**원인**: 백엔드 서버가 실행되지 않음
**확인**:
```bash
curl http://localhost:3000/api/health
```
**해결**: 백엔드 재시작
```bash
cd E:\coding\aI_ERP1\xem-system\backend
npm run start:dev
```

---

## 📊 테스트 스크립트 실행 결과

### 자동화 테스트 (`test-execution-create.js`)

**실행 명령**:
```bash
node E:\coding\aI_ERP1\test-execution-create.js
```

**결과**:
```
========================================
집행 요청 생성 테스트
========================================

1️⃣ 로그인 (staff1@xem.com)...
✅ 로그인 성공

2️⃣ 프로젝트 목록 조회...
✅ 4개 프로젝트 발견
   선택: PRJ-2024-003 - 송도 주상복합

3️⃣ 예산 항목 조회...
✅ 30개 예산 항목 발견
   선택: 경비 > 운영비 > 수도료
   잔액: ₩5,000,000

4️⃣ 집행 요청 생성...
   요청 데이터: {
  "projectId": "dbc32784-68f7-49df-a8af-662b592a1517",
  "budgetItemId": "35b02fc9-d038-478f-9c2f-30e675afa43f",
  "amount": 500000,
  "executionDate": "2025-11-17",
  "purpose": "수도 요금 납부",
  "description": "테스트용 집행 요청",
  "attachments": []
}
✅ 집행 요청 생성 성공!
   요청 번호: EXE-2025-0008
   금액: ₩500,000
   상태: PENDING
   현재 단계: 1

5️⃣ 집행 요청 목록 확인...
✅ 집행 요청이 목록에서 확인됨
   총 9개의 집행 요청 존재

========================================
✅ 테스트 완료 - 모든 단계 성공!
========================================
```

**결론**: 백엔드 API는 완벽하게 작동하고 있습니다.

---

## 🎯 추천 디버깅 순서

1. **브라우저에서 F12 → Console 탭 확인** ← 먼저 시작
2. **브라우저에서 F12 → Network 탭 확인**
3. **Application 탭에서 xem_token 확인**
4. **수동으로 폼 작성 및 제출 테스트**
5. **발견된 에러 메시지 기록**

---

## 📞 추가 지원이 필요한 경우

다음 정보를 제공해주세요:

1. **Console 에러 메시지** (있는 경우)
   - 전체 에러 스택 트레이스 복사

2. **Network 요청 정보**
   - 요청 URL
   - 상태 코드
   - Response 내용

3. **재현 단계**
   - 어떤 순서로 클릭했는지
   - 어떤 값을 입력했는지

4. **스크린샷**
   - 에러 발생 시점의 화면
   - 개발자 도구 Console/Network 탭

---

## ✅ 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 백엔드 API | ✅ 정상 | 테스트 완료 |
| 프로젝트 드롭다운 | ✅ 수정됨 | 2025-11-17 수정 |
| 예산 항목 드롭다운 | ✅ 수정됨 | 2025-11-17 수정 |
| 집행 요청 생성 로직 | ✅ 정상 | 코드 검토 완료 |
| 인증 토큰 처리 | ✅ 정상 | api.ts 확인 완료 |
| 프론트엔드 연결 | ⚠️ 확인 필요 | 사용자 디버깅 필요 |

---

**생성일**: 2025-11-17
**작성자**: Claude Code (Automated Debugging Guide)
