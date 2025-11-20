# Docker 컨테이너 충돌 문제 해결 가이드

## 문제 상황
```
Error: The container name "/xem-postgres" is already in use
```

기존에 실행 중인 `xem-postgres` 컨테이너가 있어서 새로 시작할 수 없습니다.

---

## 해결 방법

### 방법 1: 기존 컨테이너 완전히 제거 후 재시작 (권장)

```bash
# 1. 기존 컨테이너 중지 및 제거
cd /home/user/aI_ERP1/xem-system
docker compose down

# 2. 볼륨까지 완전히 제거 (데이터베이스 초기화)
docker compose down -v

# 3. 다시 시작
docker compose up -d

# 4. Seed 데이터 적용
cd backend
npm run seed
```

### 방법 2: 기존 컨테이너 재사용

```bash
# 1. 실행 중인 컨테이너 확인
docker ps -a

# 2. xem-postgres 컨테이너 시작
docker start xem-postgres

# 3. Backend만 재시작
cd /home/user/aI_ERP1/xem-system/backend
npm run start:dev
```

### 방법 3: 수동으로 컨테이너 제거

```bash
# 1. 컨테이너 중지
docker stop xem-postgres xem-backend xem-frontend

# 2. 컨테이너 제거
docker rm xem-postgres xem-backend xem-frontend

# 3. 다시 시작
cd /home/user/aI_ERP1/xem-system
docker compose up -d
```

---

## 완전 초기화 (새로 시작)

데이터베이스를 포함한 모든 것을 초기화하려면:

```bash
# 1. 모든 컨테이너 중지 및 제거
cd /home/user/aI_ERP1/xem-system
docker compose down -v

# 2. 이미지 제거 (선택)
docker rmi xem-system-backend xem-system-frontend

# 3. Docker 볼륨 확인 및 제거
docker volume ls | grep xem
docker volume rm xem-system_postgres_data

# 4. 깨끗하게 다시 빌드 및 시작
docker compose up -d --build

# 5. 로그 확인
docker compose logs -f

# 6. Seed 데이터 적용
docker compose exec backend npm run seed
```

---

## 시스템 구동 확인

### 1. 컨테이너 상태 확인
```bash
docker compose ps
```

**예상 출력:**
```
NAME                IMAGE                    STATUS
xem-postgres        postgres:15              Up
xem-backend         xem-system-backend       Up
xem-frontend        xem-system-frontend      Up
```

### 2. 데이터베이스 연결 확인
```bash
docker compose exec backend npm run prisma:studio
```

### 3. API 테스트
```bash
# Health check
curl http://localhost:3000/api/health

# Swagger 문서
curl http://localhost:3000/api/docs
```

### 4. Frontend 접속
```
http://localhost:5173
```

---

## Seed 데이터 적용

데이터베이스가 비어있는 경우:

```bash
# Docker 환경
docker compose exec backend npm run seed

# 로컬 개발 환경
cd /home/user/aI_ERP1/xem-system/backend
npm run seed
```

**Seed 데이터 포함 내용:**
- ✅ 8명의 사용자 (ADMIN, CFO, RM_TEAM, TEAM_LEAD, APPROVER x2, STAFF x2)
- ✅ 2개 프로젝트
- ✅ 예산 항목 (집행 이력 포함)
- ✅ 1개 대기 중인 집행 요청 (EXE-2024-0001)
- ✅ 1개 승인된 예산 전용 + 1개 대기 중인 예산 전용

---

## 테스트 계정

```
APPROVER 역할 (승인권자):
- approver1@xem.com / password123
- approver2@xem.com / password123

STAFF 역할 (담당자):
- staff1@xem.com / password123
- staff2@xem.com / password123

기타:
- admin@xem.com / password123 (ADMIN)
- cfo@xem.com / password123 (CFO)
- rm@xem.com / password123 (RM_TEAM)
- teamlead@xem.com / password123 (TEAM_LEAD)
```

---

## 로컬 개발 환경 (Docker 없이)

Docker를 사용하지 않고 로컬에서 실행하려면:

### 1. PostgreSQL 설치 및 실행

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# macOS
brew install postgresql@15
brew services start postgresql@15
```

### 2. 데이터베이스 생성

```bash
sudo -u postgres psql
CREATE DATABASE xem_db;
CREATE USER xem_user WITH PASSWORD 'xem_password';
GRANT ALL PRIVILEGES ON DATABASE xem_db TO xem_user;
\q
```

### 3. 환경 변수 설정

```bash
cd /home/user/aI_ERP1/xem-system/backend
cp .env.example .env
```

**`.env` 파일 수정:**
```env
DATABASE_URL="postgresql://xem_user:xem_password@localhost:5432/xem_db"
JWT_SECRET="xem-super-secret-jwt-key-change-in-production-2025"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

### 4. 마이그레이션 및 Seed

```bash
cd /home/user/aI_ERP1/xem-system/backend
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### 5. Backend 실행

```bash
cd /home/user/aI_ERP1/xem-system/backend
npm run start:dev
```

### 6. Frontend 실행 (새 터미널)

```bash
cd /home/user/aI_ERP1/xem-system/frontend
npm install
npm run dev
```

---

## 문제 해결

### PostgreSQL 포트 충돌
```bash
# 5432 포트 사용 중인 프로세스 확인
sudo lsof -i :5432

# 프로세스 종료
sudo kill -9 <PID>
```

### Backend 포트 충돌
```bash
# 3000 포트 사용 중인 프로세스 확인
sudo lsof -i :3000

# 프로세스 종료
sudo kill -9 <PID>
```

### Frontend 포트 충돌
```bash
# 5173 포트 사용 중인 프로세스 확인
sudo lsof -i :5173

# 프로세스 종료
sudo kill -9 <PID>
```

---

## 추천 실행 순서

```bash
# 1. Docker 환경 정리
docker compose down -v

# 2. 다시 시작
docker compose up -d --build

# 3. 로그 확인 (문제 발생 시)
docker compose logs -f backend

# 4. Seed 데이터 적용
docker compose exec backend npm run seed

# 5. Frontend 접속
open http://localhost:5173

# 6. Swagger 문서 확인
open http://localhost:3000/api/docs
```

이 순서대로 진행하면 시스템이 정상적으로 구동됩니다!
