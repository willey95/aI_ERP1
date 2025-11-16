#!/bin/bash

# XEM System - 개발 환경 시작 스크립트
# 사용법: ./start.sh

set -e

echo "🚀 XEM System 시작 중..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 현재 디렉토리 확인
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 오류: xem-system 디렉토리에서 실행해주세요${NC}"
    exit 1
fi

# 단계 1: Docker 컨테이너 시작
echo -e "${BLUE}📦 단계 1/5: Docker 컨테이너 시작 (PostgreSQL + Redis)${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Docker 컨테이너 시작됨${NC}"
echo ""

# Docker가 완전히 시작될 때까지 대기
echo -e "${YELLOW}⏳ 데이터베이스 준비 대기 중... (5초)${NC}"
sleep 5
echo ""

# 단계 2: 백엔드 의존성 설치 및 준비
echo -e "${BLUE}📦 단계 2/5: 백엔드 설정${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "  📥 백엔드 의존성 설치 중..."
    npm install > /dev/null 2>&1
    echo -e "${GREEN}  ✅ 백엔드 의존성 설치 완료${NC}"
else
    echo -e "${GREEN}  ✅ 백엔드 의존성 이미 설치됨${NC}"
fi

echo "  🔧 Prisma 클라이언트 생성 중..."
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}  ✅ Prisma 클라이언트 생성 완료${NC}"

echo "  🗄️  데이터베이스 스키마 동기화 중..."
npx prisma db push > /dev/null 2>&1
echo -e "${GREEN}  ✅ 데이터베이스 스키마 동기화 완료${NC}"

# 시드 데이터가 이미 있는지 확인
SEED_CHECK=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1 | tr -d ' ')
if [ "$SEED_CHECK" = "0" ] || [ -z "$SEED_CHECK" ]; then
    echo "  🌱 시드 데이터 생성 중..."
    npm run seed > /dev/null 2>&1
    echo -e "${GREEN}  ✅ 시드 데이터 생성 완료${NC}"
else
    echo -e "${YELLOW}  ⚠️  시드 데이터가 이미 존재합니다 (건너뜀)${NC}"
fi

cd ..
echo ""

# 단계 3: 프론트엔드 의존성 설치
echo -e "${BLUE}📦 단계 3/5: 프론트엔드 설정${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  📥 프론트엔드 의존성 설치 중..."
    npm install > /dev/null 2>&1
    echo -e "${GREEN}  ✅ 프론트엔드 의존성 설치 완료${NC}"
else
    echo -e "${GREEN}  ✅ 프론트엔드 의존성 이미 설치됨${NC}"
fi

cd ..
echo ""

# 단계 4: 환경 변수 확인
echo -e "${BLUE}📦 단계 4/5: 환경 변수 확인${NC}"

# 백엔드 .env 확인
if [ ! -f "backend/.env" ]; then
    echo "  📝 백엔드 .env 파일 생성 중..."
    cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/xem"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="xem-super-secret-jwt-key-change-in-production-2025"
PORT=3000
NODE_ENV=development
EOF
    echo -e "${GREEN}  ✅ 백엔드 .env 파일 생성됨${NC}"
else
    echo -e "${GREEN}  ✅ 백엔드 .env 파일 존재${NC}"
fi

# 프론트엔드 .env 확인
if [ ! -f "frontend/.env" ]; then
    echo "  📝 프론트엔드 .env 파일 생성 중..."
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3000
EOF
    echo -e "${GREEN}  ✅ 프론트엔드 .env 파일 생성됨${NC}"
else
    echo -e "${GREEN}  ✅ 프론트엔드 .env 파일 존재${NC}"
fi

echo ""

# 단계 5: 서버 시작
echo -e "${BLUE}📦 단계 5/5: 서버 시작${NC}"
echo ""

# 백엔드 시작 (백그라운드)
echo -e "${YELLOW}🔧 백엔드 서버 시작 중...${NC}"
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..
echo -e "${GREEN}✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"
echo "   로그: tail -f backend.log"
echo ""

# 백엔드가 시작될 때까지 대기
echo -e "${YELLOW}⏳ 백엔드 준비 대기 중... (10초)${NC}"
sleep 10
echo ""

# 프론트엔드 시작 (백그라운드)
echo -e "${YELLOW}🎨 프론트엔드 서버 시작 중...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..
echo -e "${GREEN}✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)${NC}"
echo "   로그: tail -f frontend.log"
echo ""

# 완료 메시지
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 XEM System이 성공적으로 시작되었습니다!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 접속 정보:${NC}"
echo "   🌐 프론트엔드:  http://localhost:5173"
echo "   🔧 백엔드 API:  http://localhost:3000"
echo "   📚 API 문서:    http://localhost:3000/api"
echo ""
echo -e "${BLUE}👤 테스트 계정:${NC}"
echo "   📧 이메일: staff1@xem.com"
echo "   🔑 비밀번호: password123"
echo ""
echo -e "${BLUE}🔧 관리 명령어:${NC}"
echo "   중지:        ./stop.sh"
echo "   재시작:      ./restart.sh"
echo "   로그 보기:   tail -f backend.log  (또는 frontend.log)"
echo "   상태 확인:   ./status.sh"
echo ""
echo -e "${YELLOW}💡 팁: 브라우저에서 http://localhost:5173 를 열어보세요!${NC}"
echo ""

# 로그 자동 출력 (옵션)
if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
    echo -e "${BLUE}📋 실시간 로그 출력 (Ctrl+C로 종료)${NC}"
    echo ""
    tail -f backend.log frontend.log
fi
