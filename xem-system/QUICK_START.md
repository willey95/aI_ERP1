# XEM System - 빠른 시작 가이드

## 🚀 한 번에 시작하기

```bash
cd xem-system
./start.sh
```

끝! 이제 브라우저에서 `http://localhost:5173` 을 열어보세요.

---

## 📋 관리 명령어

### 시작
```bash
./start.sh              # 전체 시스템 시작
./start.sh --logs       # 시작 후 로그 실시간 출력
```

### 중지
```bash
./stop.sh               # 애플리케이션만 중지 (Docker는 계속 실행)
./stop.sh --docker      # Docker도 함께 중지
```

### 재시작
```bash
./restart.sh            # 전체 재시작
```

### 상태 확인
```bash
./status.sh             # 현재 실행 상태 확인
```

### 로그 보기
```bash
./logs.sh               # 전체 로그 보기 (기본값)
./logs.sh backend       # 백엔드 로그만 보기
./logs.sh frontend      # 프론트엔드 로그만 보기
```

### 데이터베이스 리셋
```bash
./reset-db.sh           # ⚠️ 모든 데이터 삭제 후 재생성
```

---

## 👤 테스트 계정

모든 계정의 비밀번호: `password123`

| 이메일 | 역할 | 워크플로우 권한 |
|--------|------|------|
| admin@xem.com | 관리자 | 전체 권한 |
| **approver1@xem.com** | **승인권자** | **2단계 승인 (최종 승인)** ⭐ |
| **approver2@xem.com** | **승인권자** | **2단계 승인 (최종 승인)** ⭐ |
| cfo@xem.com | CFO | 관리자 권한 |
| rm@xem.com | RM팀 | 관리자 권한 |
| teamlead@xem.com | 팀장 | 프로젝트 관리 |
| staff1@xem.com | 담당자 | 집행 요청 작성 |
| staff2@xem.com | 담당자 | 집행 요청 작성 |

**📌 새로운 2단계 워크플로우:**
- **1단계**: 담당자(STAFF) - 자동 승인
- **2단계**: 승인권자(APPROVER) - 수동 승인 ✅

---

## 🔗 접속 URL

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3000
- **API 문서**: http://localhost:3000/api

---

## 🛠 문제 해결

### Docker 컨테이너 충돌 ⚠️

**에러 메시지:**
```
Error: The container name "/xem-postgres" is already in use
```

**빠른 해결:**
```bash
# 방법 1: 자동 스크립트 사용 (권장)
./docker-reset.sh          # 완전 초기화
# 또는
./docker-restart.sh        # 단순 재시작

# 방법 2: 수동 명령어
docker compose down -v     # 컨테이너 제거
docker compose up -d       # 재시작
docker compose exec backend npm run seed  # Seed 데이터
```

**자세한 해결 방법:** [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) 참고

### 포트가 이미 사용 중
```bash
# 실행 중인 프로세스 확인
./status.sh

# 기존 프로세스 종료
./stop.sh --docker

# 재시작
./start.sh
```

### 데이터베이스 오류
```bash
# Docker 재시작
./stop.sh --docker
docker compose up -d

# 데이터베이스 리셋
./reset-db.sh
```

### 의존성 설치 오류
```bash
# 백엔드
cd backend
rm -rf node_modules package-lock.json
npm install

# 프론트엔드
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 로그 확인
```bash
# 실시간 로그
./logs.sh

# 저장된 로그 파일
cat backend.log
cat frontend.log
```

---

## 📊 시스템 워크플로우

### 새로운 2단계 집행 요청 프로세스 ⭐

```
1. 담당자(STAFF)가 집행 요청 생성
   ↓
2. STAFF 자동 승인 (1단계) ✅
   ↓
3. APPROVER 수동 승인 (2단계) 👤
   ↓
4. 예산 자동 업데이트
```

### 예산 전용 프로세스 (신규 기능!)

```
1. 담당자가 품의 작성 시 예산 가용성 확인 💡
   ↓
2-A. 예산 충분 ✅
     → 집행 요청만 생성

2-B. 예산 부족 ❌
     → 시스템이 전용 시나리오 자동 제안
     → 담당자가 시나리오 선택
     → 예산 전용 + 집행 요청 통합 제출
     ↓
3. APPROVER가 상세 대시보드에서 확인:
   - 예산 가용성 체크
   - 공사비 영향 분석
   - 예산 전용 내역 검토
   - 시스템 추천 의견 확인
     ↓
4. 승인 또는 반려
```

### 테스트 시나리오

#### 시나리오 1: 예산 충분한 경우

1. **staff1@xem.com으로 로그인**
   - Executions → New Request 클릭
   - 프로젝트 선택: 강남 아파트 개발
   - 예산 항목: 공사비 - 전기공사
   - 집행 금액: 100,000,000원
   - 💡 예산 가용성 확인 → ✅ 충분
   - 집행 요청 제출

2. **approver1@xem.com으로 로그인**
   - Approvals → 대기 중인 요청 확인
   - 상세 분석 페이지 검토
   - ✅ 승인

#### 시나리오 2: 예산 부족 + 전용

1. **staff1@xem.com으로 로그인**
   - Executions → New Request 클릭
   - 프로젝트: 강남 아파트 개발
   - 예산 항목: 공사비 - 토목공사 (잔액 부족)
   - 집행 금액: 500,000,000원
   - 💡 예산 가용성 확인 → ❌ 부족 (2억원)
   - 전용 시나리오 자동 제안 확인
   - 시나리오 선택 (건축공사 → 토목공사)
   - 집행 요청 제출

2. **approver1@xem.com으로 로그인**
   - Approvals → 대기 중인 요청 확인
   - 상세 분석 확인:
     * 예산 항목 분석
     * 공사비 영향 분석 ⚠️
     * 예산 전용 내역 (2억원 전용)
     * 시스템 추천 의견
   - ✅ 승인 또는 ❌ 반려

---

## ✅ 최신 업데이트 (v3.1)

### 새로운 기능
- ✅ **2단계 승인 워크플로우** (STAFF → APPROVER)
- ✅ **예산 전용 시스템** (돈의 꼬리표)
- ✅ **품의 작성 지원** (실시간 예산 체크 + 전용 시나리오 제안)
- ✅ **승인권자용 상세 대시보드** (6개 분석 섹션)
- ✅ **공사비 영향 분석** (훼손 위험 자동 감지)
- ✅ **시스템 추천 의견** (INFO/WARNING/CRITICAL)

### 수정된 주요 이슈
- ✅ RolesGuard 및 RBAC 구현
- ✅ Transaction 처리 (Prisma $transaction)
- ✅ DTO 구조 통일 (Frontend/Backend)
- ✅ Division by zero 수정
- ✅ Database indexes 추가 (18개)

---

## 📚 추가 문서

- [Docker 문제 해결](DOCKER_TROUBLESHOOTING.md) - Docker 충돌 및 문제 해결 상세 가이드
- [워크플로우 검증 보고서](WORKFLOW_VERIFICATION_REPORT.md) - 담당자/승인권자 Agent 분석
- [P1/P2 개선사항](P1_P2_ENHANCEMENTS_REPORT.md) - 환경 변수 검증, Rate Limiting, Health Check 등
- [전체 README](README.md) - 상세 시스템 문서
- [디버깅 리포트](DEBUGGING_REPORT.md) - 발견된 이슈 및 수정 가이드

---

## 💡 팁

- 자동으로 로그를 보려면: `./start.sh --logs`
- 백그라운드로 실행 후 나중에 로그 보기: `./logs.sh`
- 시스템 상태가 궁금하면: `./status.sh`
- 데이터를 초기화하고 싶으면: `./reset-db.sh`

---

**즐거운 개발 되세요! 🚀**
