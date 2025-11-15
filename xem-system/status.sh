#!/bin/bash

# XEM System - 상태 확인 스크립트
# 사용법: ./status.sh

echo "🔍 XEM System 상태 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 백엔드 상태
echo -e "${BLUE}📦 백엔드 서버:${NC}"
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "   상태: ${GREEN}● 실행 중${NC}"
        echo "   PID:  $BACKEND_PID"
        echo "   URL:  http://localhost:3000"

        # API 응답 확인
        if curl -s http://localhost:3000/api > /dev/null 2>&1; then
            echo -e "   API:  ${GREEN}✓ 응답함${NC}"
        else
            echo -e "   API:  ${YELLOW}⚠ 응답 없음 (시작 중일 수 있음)${NC}"
        fi
    else
        echo -e "   상태: ${RED}● 중지됨 (프로세스 없음)${NC}"
        echo "   PID:  $BACKEND_PID (종료됨)"
    fi
else
    echo -e "   상태: ${RED}● 중지됨${NC}"
    echo "   PID:  없음"
fi
echo ""

# 프론트엔드 상태
echo -e "${BLUE}🎨 프론트엔드 서버:${NC}"
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "   상태: ${GREEN}● 실행 중${NC}"
        echo "   PID:  $FRONTEND_PID"
        echo "   URL:  http://localhost:5173"

        # 응답 확인
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo -e "   응답: ${GREEN}✓ 접근 가능${NC}"
        else
            echo -e "   응답: ${YELLOW}⚠ 접근 불가 (시작 중일 수 있음)${NC}"
        fi
    else
        echo -e "   상태: ${RED}● 중지됨 (프로세스 없음)${NC}"
        echo "   PID:  $FRONTEND_PID (종료됨)"
    fi
else
    echo -e "   상태: ${RED}● 중지됨${NC}"
    echo "   PID:  없음"
fi
echo ""

# Docker 상태
echo -e "${BLUE}🐳 Docker 컨테이너:${NC}"
if command -v docker-compose &> /dev/null; then
    POSTGRES_STATUS=$(docker-compose ps -q postgres 2>/dev/null)
    REDIS_STATUS=$(docker-compose ps -q redis 2>/dev/null)

    if [ ! -z "$POSTGRES_STATUS" ]; then
        POSTGRES_RUNNING=$(docker inspect -f '{{.State.Running}}' $(docker-compose ps -q postgres) 2>/dev/null)
        if [ "$POSTGRES_RUNNING" = "true" ]; then
            echo -e "   PostgreSQL: ${GREEN}● 실행 중${NC}"
        else
            echo -e "   PostgreSQL: ${RED}● 중지됨${NC}"
        fi
    else
        echo -e "   PostgreSQL: ${RED}● 없음${NC}"
    fi

    if [ ! -z "$REDIS_STATUS" ]; then
        REDIS_RUNNING=$(docker inspect -f '{{.State.Running}}' $(docker-compose ps -q redis) 2>/dev/null)
        if [ "$REDIS_RUNNING" = "true" ]; then
            echo -e "   Redis:      ${GREEN}● 실행 중${NC}"
        else
            echo -e "   Redis:      ${RED}● 중지됨${NC}"
        fi
    else
        echo -e "   Redis:      ${RED}● 없음${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠ docker-compose 명령어를 찾을 수 없습니다${NC}"
fi
echo ""

# 포트 사용 현황
echo -e "${BLUE}🔌 포트 사용 현황:${NC}"
PORT_3000=$(lsof -ti:3000 2>/dev/null)
PORT_5173=$(lsof -ti:5173 2>/dev/null)
PORT_5432=$(lsof -ti:5432 2>/dev/null)
PORT_6379=$(lsof -ti:6379 2>/dev/null)

if [ ! -z "$PORT_3000" ]; then
    echo -e "   3000 (Backend):    ${GREEN}● 사용 중${NC}"
else
    echo -e "   3000 (Backend):    ${YELLOW}○ 사용 가능${NC}"
fi

if [ ! -z "$PORT_5173" ]; then
    echo -e "   5173 (Frontend):   ${GREEN}● 사용 중${NC}"
else
    echo -e "   5173 (Frontend):   ${YELLOW}○ 사용 가능${NC}"
fi

if [ ! -z "$PORT_5432" ]; then
    echo -e "   5432 (PostgreSQL): ${GREEN}● 사용 중${NC}"
else
    echo -e "   5432 (PostgreSQL): ${YELLOW}○ 사용 가능${NC}"
fi

if [ ! -z "$PORT_6379" ]; then
    echo -e "   6379 (Redis):      ${GREEN}● 사용 중${NC}"
else
    echo -e "   6379 (Redis):      ${YELLOW}○ 사용 가능${NC}"
fi
echo ""

# 로그 파일 크기
echo -e "${BLUE}📋 로그 파일:${NC}"
if [ -f "backend.log" ]; then
    BACKEND_LOG_SIZE=$(du -h backend.log | cut -f1)
    echo "   backend.log:  $BACKEND_LOG_SIZE"
else
    echo "   backend.log:  없음"
fi

if [ -f "frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(du -h frontend.log | cut -f1)
    echo "   frontend.log: $FRONTEND_LOG_SIZE"
else
    echo "   frontend.log: 없음"
fi
echo ""

# 전체 상태 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALL_RUNNING=true

if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        ALL_RUNNING=false
    fi
else
    ALL_RUNNING=false
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        ALL_RUNNING=false
    fi
else
    ALL_RUNNING=false
fi

if [ "$ALL_RUNNING" = true ]; then
    echo -e "${GREEN}✅ 전체 시스템이 정상 작동 중입니다${NC}"
    echo ""
    echo -e "${BLUE}🌐 접속 URL:${NC}"
    echo "   프론트엔드: http://localhost:5173"
    echo "   백엔드 API: http://localhost:3000/api"
else
    echo -e "${YELLOW}⚠️  일부 서비스가 실행되지 않고 있습니다${NC}"
    echo ""
    echo "시작하려면: ./start.sh"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
