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

| 이메일 | 역할 | 권한 |
|--------|------|------|
| admin@xem.com | 관리자 | 전체 권한 |
| cfo@xem.com | CFO | 4단계 최종 승인 |
| rm@xem.com | RM팀 | 3단계 승인 |
| teamlead@xem.com | 팀장 | 2단계 승인 |
| staff1@xem.com | 직원1 | 1단계 승인 |
| staff2@xem.com | 직원2 | 1단계 승인 |

---

## 🔗 접속 URL

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3000
- **API 문서**: http://localhost:3000/api

---

## 🛠 문제 해결

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
docker-compose up -d

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

### 집행 요청 프로세스

```
1. 직원이 집행 요청 생성
   ↓
2. STAFF 승인 (1단계)
   ↓
3. TEAM_LEAD 승인 (2단계)
   ↓
4. RM_TEAM 승인 (3단계)
   ↓
5. CFO 최종 승인 (4단계)
   ↓
6. 예산 자동 업데이트
```

### 테스트 시나리오

1. **staff1@xem.com으로 로그인**
   - 집행 요청 생성

2. **staff2@xem.com으로 로그인**
   - 1단계 승인 (STAFF)

3. **teamlead@xem.com으로 로그인**
   - 2단계 승인 (TEAM_LEAD)

4. **rm@xem.com으로 로그인**
   - 3단계 승인 (RM_TEAM)

5. **cfo@xem.com으로 로그인**
   - 4단계 최종 승인 (CFO)
   - 예산 자동 업데이트 확인

---

## 🐛 알려진 이슈

**⚠️ 주의**: 현재 버전은 개발 버전으로, 프로덕션 배포 전 반드시 `DEBUGGING_REPORT.md`의 P0 이슈를 수정해야 합니다.

주요 이슈:
- 역할 기반 권한 검증 미구현
- 트랜잭션 처리 미구현
- 모바일 반응형 미지원

자세한 내용은 `DEBUGGING_REPORT.md` 참조

---

## 📚 추가 문서

- [전체 README](README.md) - 상세 시스템 문서
- [디버깅 리포트](DEBUGGING_REPORT.md) - 발견된 이슈 및 수정 가이드
- [구현 가이드](../XEM_Complete_Implementation_Guide.md) - 시스템 설계 문서

---

## 💡 팁

- 자동으로 로그를 보려면: `./start.sh --logs`
- 백그라운드로 실행 후 나중에 로그 보기: `./logs.sh`
- 시스템 상태가 궁금하면: `./status.sh`
- 데이터를 초기화하고 싶으면: `./reset-db.sh`

---

**즐거운 개발 되세요! 🚀**
