#!/bin/bash

# XEM System - 중지 스크립트
# 사용법: ./stop.sh

echo "🛑 XEM System 중지 중..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 백엔드 중지
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⏸️  백엔드 서버 중지 중 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        sleep 2
        # 강제 종료가 필요한 경우
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${RED}   강제 종료 중...${NC}"
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✅ 백엔드 서버 중지됨${NC}"
    else
        echo -e "${YELLOW}⚠️  백엔드 서버가 이미 중지되어 있습니다${NC}"
    fi
    rm backend.pid
else
    echo -e "${YELLOW}⚠️  백엔드 PID 파일이 없습니다${NC}"
fi

# 프론트엔드 중지
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⏸️  프론트엔드 서버 중지 중 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        sleep 2
        # 강제 종료가 필요한 경우
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${RED}   강제 종료 중...${NC}"
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✅ 프론트엔드 서버 중지됨${NC}"
    else
        echo -e "${YELLOW}⚠️  프론트엔드 서버가 이미 중지되어 있습니다${NC}"
    fi
    rm frontend.pid
else
    echo -e "${YELLOW}⚠️  프론트엔드 PID 파일이 없습니다${NC}"
fi

# Docker 중지 (옵션)
if [ "$1" = "--docker" ] || [ "$1" = "-d" ]; then
    echo ""
    echo -e "${YELLOW}🐳 Docker 컨테이너 중지 중...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Docker 컨테이너 중지됨${NC}"
fi

echo ""
echo -e "${GREEN}✅ XEM System이 중지되었습니다${NC}"
echo ""

if [ "$1" != "--docker" ] && [ "$1" != "-d" ]; then
    echo -e "${YELLOW}💡 참고: Docker 컨테이너는 계속 실행 중입니다${NC}"
    echo "   Docker도 중지하려면: ./stop.sh --docker"
    echo ""
fi
