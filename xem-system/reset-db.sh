#!/bin/bash

# XEM System - 데이터베이스 리셋 스크립트
# 경고: 모든 데이터가 삭제됩니다!
# 사용법: ./reset-db.sh

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}⚠️  경고: 데이터베이스 리셋${NC}"
echo ""
echo "이 작업은 다음을 수행합니다:"
echo "  1. 모든 데이터베이스 데이터 삭제"
echo "  2. 스키마 재생성"
echo "  3. 시드 데이터 재생성"
echo ""
echo -e "${RED}모든 데이터가 삭제됩니다!${NC}"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "취소되었습니다."
    exit 0
fi

echo ""
echo -e "${YELLOW}🗄️  데이터베이스 리셋 중...${NC}"
echo ""

cd backend

# Prisma 데이터베이스 리셋
echo "1️⃣  데이터베이스 초기화 중..."
npx prisma db push --force-reset --accept-data-loss > /dev/null 2>&1
echo -e "${GREEN}✅ 데이터베이스 초기화 완료${NC}"

# Prisma 클라이언트 재생성
echo "2️⃣  Prisma 클라이언트 생성 중..."
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}✅ Prisma 클라이언트 생성 완료${NC}"

# 시드 데이터 생성
echo "3️⃣  시드 데이터 생성 중..."
npm run seed > /dev/null 2>&1
echo -e "${GREEN}✅ 시드 데이터 생성 완료${NC}"

cd ..

echo ""
echo -e "${GREEN}✅ 데이터베이스 리셋이 완료되었습니다!${NC}"
echo ""
echo "생성된 테스트 계정:"
echo "  - admin@xem.com (ADMIN)"
echo "  - cfo@xem.com (CFO)"
echo "  - rm@xem.com (RM_TEAM)"
echo "  - teamlead@xem.com (TEAM_LEAD)"
echo "  - staff1@xem.com (STAFF)"
echo "  - staff2@xem.com (STAFF)"
echo ""
echo "  비밀번호: password123"
echo ""
