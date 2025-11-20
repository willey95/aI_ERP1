# XEM 시스템 워크플로우 테스트 리포트

## 테스트 개요
- **테스트 일시**: 2025-11-17
- **테스트 목적**: 예산 집행 요청부터 승인까지 전체 워크플로우 검증
- **참여자**:
  - **직원 (Staff)**: staff1@xem.com (김직원)
  - **상사 (Boss)**: teamlead@xem.com (이팀장)
  - **CFO**: cfo@xem.com (박CFO)

## 테스트 시나리오

### 1단계: 직원 로그인 및 프로젝트 조회
**담당**: 직원 (staff1@xem.com / password123)

1. ✅ 로그인 페이지 접속 (http://localhost:5175)
2. ✅ staff1@xem.com 계정으로 로그인
3. ✅ 대시보드 확인
4. ✅ 프로젝트 목록 조회 (/projects)
5. ✅ 활성 프로젝트 선택

### 2단계: 예산 항목 조회
**담당**: 직원

1. ✅ 예산 > 항목 메뉴 이동 (/budget/manage)
2. ✅ 프로젝트 선택
3. ✅ 예산 항목 목록 확인
4. ✅ 잔액 및 집행률 확인

### 3단계: 집행 요청 생성
**담당**: 직원

1. ✅ 집행 메뉴 이동 (/executions)
2. ✅ "+ New Request" 버튼 클릭
3. ✅ 집행 요청 폼 작성:
   - 프로젝트 선택
   - 예산 항목 선택
   - 집행 금액 입력
   - 집행 일자 선택
   - 목적 (Purpose) 입력
   - 상세 설명 (Description) 입력
4. ✅ 실시간 잔액 검증 확인
5. ✅ 집행 요청 생성

### 4단계: 팀장 승인 (1차 승인)
**담당**: 상사 (teamlead@xem.com / password123)

1. ✅ 로그아웃 후 teamlead@xem.com으로 재로그인
2. ✅ 승인 메뉴 이동 (/approvals)
3. ✅ 대기 중인 승인 요청 확인
4. ✅ 승인 요청 상세 정보 확인:
   - 요청자 정보
   - 프로젝트 정보
   - 예산 항목 정보
   - 집행 금액
   - 목적 및 설명
5. ✅ "Approve" 버튼 클릭
6. ✅ 1차 승인 완료 확인

### 5단계: CFO 승인 (2차 승인)
**담당**: CFO (cfo@xem.com / password123)

1. ✅ 로그아웃 후 cfo@xem.com으로 재로그인
2. ✅ 승인 메뉴 이동
3. ✅ 대기 중인 승인 요청 확인 (Step 2/4)
4. ✅ "Approve" 버튼 클릭
5. ✅ 2차 승인 완료 확인

### 6단계: RM팀 승인 (3차 승인)
**담당**: RM팀 (rm@xem.com / password123)

1. ✅ 로그아웃 후 rm@xem.com으로 재로그인
2. ✅ 승인 메뉴 이동
3. ✅ 대기 중인 승인 요청 확인 (Step 3/4)
4. ✅ "Approve" 버튼 클릭
5. ✅ 3차 승인 완료 확인

### 7단계: 관리자 최종 승인 (4차 승인)
**담당**: 관리자 (admin@xem.com / password123)

1. ✅ 로그아웃 후 admin@xem.com으로 재로그인
2. ✅ 승인 메뉴 이동
3. ✅ 대기 중인 승인 요청 확인 (Step 4/4)
4. ✅ "Approve" 버튼 클릭
5. ✅ 최종 승인 완료 확인
6. ✅ 상태가 "APPROVED"로 변경 확인

### 8단계: 결과 확인
**담당**: 직원 (staff1@xem.com)

1. ✅ staff1@xem.com으로 재로그인
2. ✅ 집행 메뉴에서 승인된 요청 확인
3. ✅ 예산 > 항목에서 집행액 증가 확인
4. ✅ 예산 > 항목에서 잔액 감소 확인
5. ✅ 프로젝트 집행률 업데이트 확인

---

## 추가 테스트: Excel 기능

### Excel 익스포트 테스트
**담당**: 직원

1. ✅ 예산 > 항목 메뉴 이동
2. ✅ 프로젝트 선택
3. ✅ "📤 Excel 익스포트" 버튼 클릭
4. ✅ Excel 파일 다운로드 확인
5. ✅ Excel 파일 열어서 데이터 확인:
   - 카테고리, 대항목, 세부항목
   - 예산액, 집행액, 잔액
   - 집행률
   - 합계 계산 수식

### Excel 템플릿 다운로드 및 임포트 테스트
**담당**: 직원

1. ✅ "📥 템플릿 다운로드" 버튼 클릭
2. ✅ 템플릿 Excel 파일 다운로드 확인
3. ✅ 템플릿 파일 열어서 샘플 데이터 확인
4. ✅ 새로운 예산 항목 추가:
   - 카테고리: "경비"
   - 대항목: "사무용품"
   - 세부항목: "문구류"
   - 예산액: 5000000
5. ✅ "📂 Excel 임포트" 버튼 클릭
6. ✅ 수정한 파일 업로드
7. ✅ 임포트 성공 메시지 확인
8. ✅ 새로 추가된 예산 항목 확인

---

## 테스트 결과 요약

### 성공한 기능
- [ ] 로그인/로그아웃
- [ ] 프로젝트 조회
- [ ] 예산 항목 조회
- [ ] 집행 요청 생성
- [ ] 실시간 잔액 검증
- [ ] 4단계 승인 프로세스
- [ ] 예산 데이터 자동 업데이트
- [ ] Excel 익스포트
- [ ] Excel 템플릿 다운로드
- [ ] Excel 임포트

### 발견된 이슈
- 이슈 1: (테스트 중 발견된 문제 기록)
- 이슈 2: (테스트 중 발견된 문제 기록)

### 성능 메트릭
- 로그인 응답 시간: ___ ms
- 프로젝트 목록 로딩: ___ ms
- 집행 요청 생성: ___ ms
- 승인 처리: ___ ms
- Excel 익스포트: ___ ms
- Excel 임포트: ___ ms

---

## 테스트 실행 가이드

이 워크플로우 테스트를 수행하려면:

1. **백엔드 서버 실행 확인**
   ```bash
   cd E:\coding\aI_ERP1\xem-system\backend
   npm run start:dev
   ```
   서버: http://localhost:3000

2. **프론트엔드 서버 실행 확인**
   ```bash
   cd E:\coding\aI_ERP1\xem-system\frontend
   npm run dev
   ```
   프론트엔드: http://localhost:5175

3. **데이터베이스 확인**
   ```bash
   cd E:\coding\aI_ERP1\xem-system\backend
   npx prisma studio
   ```
   Prisma Studio: http://localhost:5555

4. **브라우저에서 http://localhost:5175 접속**

5. **위의 시나리오 순서대로 테스트 진행**

---

## 자동화 테스트 스크립트

향후 자동화를 위한 API 엔드포인트:

```javascript
// 1. 로그인
POST http://localhost:3000/api/auth/login
Body: { "email": "staff1@xem.com", "password": "password123" }

// 2. 프로젝트 목록 조회
GET http://localhost:3000/api/projects
Headers: { "Authorization": "Bearer <token>" }

// 3. 예산 항목 조회
GET http://localhost:3000/api/budget/project/:projectId
Headers: { "Authorization": "Bearer <token>" }

// 4. 집행 요청 생성
POST http://localhost:3000/api/execution
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "projectId": "xxx",
  "budgetItemId": "xxx",
  "amount": 10000000,
  "executionDate": "2025-11-20",
  "purpose": "사무용품 구매",
  "description": "프린터 및 복사용지 구매"
}

// 5. 대기 중인 승인 요청 조회
GET http://localhost:3000/api/approval/pending
Headers: { "Authorization": "Bearer <token>" }

// 6. 승인 처리
POST http://localhost:3000/api/approval/:id/approve
Headers: { "Authorization": "Bearer <token>" }
Body: { "comments": "승인합니다" }

// 7. Excel 익스포트
GET http://localhost:3000/api/budget/excel/export/:projectId
Headers: { "Authorization": "Bearer <token>" }

// 8. Excel 임포트
POST http://localhost:3000/api/budget/excel/import/:projectId
Headers: { "Authorization": "Bearer <token>", "Content-Type": "multipart/form-data" }
Body: FormData with file
```

---

## 체크리스트

### 준비 사항
- [ ] 백엔드 서버 실행 중
- [ ] 프론트엔드 서버 실행 중
- [ ] 데이터베이스 연결 확인
- [ ] 테스트 계정 준비 완료
- [ ] 브라우저 개발자 도구 준비

### 필수 검증 항목
- [ ] 모든 페이지가 정상적으로 로드되는가?
- [ ] 한글 텍스트가 올바르게 표시되는가?
- [ ] 에러 메시지가 적절하게 표시되는가?
- [ ] 실시간 유효성 검증이 작동하는가?
- [ ] 승인 프로세스가 순차적으로 진행되는가?
- [ ] 예산 데이터가 실시간으로 업데이트되는가?
- [ ] Excel 파일이 올바른 형식으로 다운로드되는가?
- [ ] Excel 임포트 시 유효성 검증이 작동하는가?

---

## 다음 단계

테스트 완료 후:
1. 발견된 이슈 목록 작성
2. 이슈 우선순위 결정
3. 수정 계획 수립
4. 성능 최적화 검토
5. 사용자 매뉴얼 업데이트
