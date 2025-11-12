# XEM System - eXecution & Expenditure Management

엔터프라이즈급 건설/부동산 예산 관리 플랫폼

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue)](https://www.typescriptlang.org/)

---

## 📋 목차

- [소개](#소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [API 문서](#api-문서)
- [배포](#배포)
- [라이선스](#라이선스)

---

## 🎯 소개

**XEM (eXecution & Expenditure Management)**은 건설 및 부동산 개발 회사를 위한 종합 예산 관리 시스템입니다. 수백억 원 규모의 프로젝트를 효율적으로 관리하고, 실시간 집행 현황을 모니터링하며, AI 기반 시뮬레이션을 통해 리스크를 최소화합니다.

### 핵심 가치

- **실시간 모니터링**: 프로젝트별 예산 집행률을 실시간으로 추적
- **자동화된 워크플로우**: 4단계 결재 프로세스 자동화
- **AI 기반 예측**: Claude AI를 활용한 시나리오 분석 및 리스크 예측
- **직관적인 UX**: 현대적이고 사용하기 쉬운 인터페이스

---

## ✨ 주요 기능

### 1. 프로젝트 관리
- 다중 프로젝트 동시 관리 (자체개발/SPC/공동/조합)
- 프로젝트별 예산/집행률/ROI 추적
- 리스크 스코어링 시스템

### 2. 예산 관리
- 계층적 예산 구조 (수입/지출)
- 예산 변경 이력 추적
- 실시간 집행률 계산

### 3. 집행 관리
- 품의서 작성 및 제출
- 파일 첨부 지원
- 집행 내역 조회 및 필터링

### 4. 결재 워크플로우
- 4단계 자동 결재 (담당자 → 팀장 → RM팀 → CFO)
- 결재 대기/승인/반려 상태 관리
- 결재 이력 추적

### 5. 분석 및 리포트
- 대시보드 KPI 위젯
- 집행 트렌드 분석
- 현금흐름 예측

### 6. AI 시뮬레이션
- 분양 시나리오 분석
- 공사비/금리 변동 시뮬레이션
- ROI 예측 및 최적화 권장사항

---

## 🛠 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Tables**: TanStack Table v8
- **Routing**: React Router v6

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Caching**: Redis
- **AI**: Anthropic Claude API

### DevOps
- **Containerization**: Docker + Docker Compose
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions (준비중)

---

## 🚀 시작하기

### 필수 요구사항

- Node.js >= 18.0.0
- npm >= 9.0.0 또는 pnpm >= 8.0.0
- Docker & Docker Compose (선택사항)
- PostgreSQL 16 (로컬 설치 또는 Docker)

### 설치 방법

#### 1. 저장소 클론

```bash
git clone https://github.com/willey95/aI_ERP1.git
cd aI_ERP1
```

#### 2. 의존성 설치

```bash
# pnpm 사용 권장
npm install -g pnpm
pnpm install

# 또는 npm
npm install
```

#### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 설정하세요:

```env
# Database
DATABASE_URL=postgresql://xem_user:xem_password_2024@localhost:5432/xem_db

# JWT
JWT_SECRET=your_jwt_secret_here

# Anthropic AI
ANTHROPIC_API_KEY=your_api_key_here
```

#### 4. 데이터베이스 설정

**Option A: Docker 사용**

```bash
docker-compose up -d postgres redis
```

**Option B: 로컬 PostgreSQL**

PostgreSQL을 설치하고 데이터베이스를 생성하세요.

#### 5. Prisma 마이그레이션

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
```

#### 6. 개발 서버 실행

**전체 실행 (프론트엔드 + 백엔드)**

```bash
npm run dev
```

**개별 실행**

```bash
# 프론트엔드만
npm run dev:web

# 백엔드만
npm run dev:api
```

### 접속 정보

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Prisma Studio**: `cd apps/api && npx prisma studio` (http://localhost:5555)

---

## 📁 프로젝트 구조

```
xem-system/
├── apps/
│   ├── web/                    # React Frontend
│   │   ├── src/
│   │   │   ├── components/     # UI 컴포넌트
│   │   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── features/       # 기능별 모듈
│   │   │   ├── lib/            # 유틸리티
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── types/          # TypeScript 타입
│   │   │   └── styles/         # 글로벌 스타일
│   │   └── package.json
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── modules/        # 기능 모듈
│       │   │   ├── auth/       # 인증
│       │   │   ├── projects/   # 프로젝트 관리
│       │   │   ├── budget/     # 예산 관리
│       │   │   ├── execution/  # 집행 관리
│       │   │   ├── approval/   # 결재
│       │   │   ├── analytics/  # 분석
│       │   │   └── simulation/ # 시뮬레이션
│       │   ├── common/         # 공통 유틸리티
│       │   └── config/         # 설정
│       ├── prisma/
│       │   └── schema.prisma   # 데이터베이스 스키마
│       └── package.json
│
├── packages/                   # 공유 패키지 (향후 확장)
├── docs/                       # 문서 및 명세서
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 💻 개발 가이드

### 코드 스타일

프로젝트는 ESLint와 Prettier를 사용합니다:

```bash
# Lint 체크
npm run lint

# 자동 포맷팅
npm run format
```

### 타입 체크

```bash
# Frontend
cd apps/web && npm run type-check

# Backend
cd apps/api && npm run build
```

### 테스트

```bash
# 전체 테스트
npm run test

# Frontend 테스트
npm run test:web

# Backend 테스트
npm run test:api
```

### 데이터베이스 마이그레이션

```bash
# 새 마이그레이션 생성
cd apps/api
npx prisma migrate dev --name add_new_feature

# 마이그레이션 적용
npx prisma migrate deploy

# Prisma Studio 실행
npx prisma studio
```

---

## 📚 API 문서

### 인증 API

#### POST `/api/auth/login`
사용자 로그인

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "STAFF"
  }
}
```

#### GET `/api/auth/me`
현재 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 프로젝트 API

#### GET `/api/projects`
프로젝트 목록 조회

**Query Parameters:**
- `search`: 검색어
- `status`: 프로젝트 상태 (planning, active, completed, suspended)
- `page`: 페이지 번호 (기본값: 1)
- `pageSize`: 페이지 크기 (기본값: 10)

더 많은 API 엔드포인트는 [API 문서](docs/)를 참조하세요.

---

## 🐳 Docker로 실행하기

전체 스택을 Docker로 실행:

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down

# 볼륨 포함 완전 제거
docker-compose down -v
```

---

## 🌐 배포

### Production 빌드

```bash
# 전체 빌드
npm run build

# Frontend 빌드
npm run build:web

# Backend 빌드
npm run build:api
```

### 환경 변수 (Production)

Production 환경에서는 반드시 다음 환경 변수를 안전하게 설정하세요:

- `DATABASE_URL`: Production 데이터베이스 URL
- `JWT_SECRET`: 강력한 시크릿 키
- `ANTHROPIC_API_KEY`: Anthropic API 키
- `NODE_ENV=production`

---

## 📖 추가 문서

- [소프트웨어 명세서](docs/XEM_Software_Specification.md)
- [개발 가이드](docs/XEM_Claude_Code_Prompt.md)
- [프로토타입 데모](docs/XEM-Working-System%20(4).html)

---

## 🤝 기여

이 프로젝트는 현재 비공개 프로젝트입니다. 기여를 원하시면 프로젝트 관리자에게 문의하세요.

---

## 📄 라이선스

Copyright © 2024 XEM Development Team. All rights reserved.

이 소프트웨어는 독점 라이선스입니다.

---

## 🆘 지원

문제가 발생하거나 질문이 있으시면:

- **GitHub Issues**: https://github.com/willey95/aI_ERP1/issues
- **문서**: [docs/](docs/)

---

**Built with ❤️ by XEM Development Team**
