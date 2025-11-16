#!/bin/bash

# XEM System - 로그 보기 스크립트
# 사용법: ./logs.sh [backend|frontend|both]

# 색상 정의
BLUE='\033[0;34m'
NC='\033[0m'

MODE=${1:-both}

case $MODE in
    backend|b)
        echo -e "${BLUE}📋 백엔드 로그 (Ctrl+C로 종료)${NC}"
        echo ""
        tail -f backend.log
        ;;
    frontend|f)
        echo -e "${BLUE}📋 프론트엔드 로그 (Ctrl+C로 종료)${NC}"
        echo ""
        tail -f frontend.log
        ;;
    both|all)
        echo -e "${BLUE}📋 전체 로그 (Ctrl+C로 종료)${NC}"
        echo ""
        tail -f backend.log frontend.log
        ;;
    *)
        echo "사용법: ./logs.sh [backend|frontend|both]"
        echo ""
        echo "옵션:"
        echo "  backend, b    - 백엔드 로그만 표시"
        echo "  frontend, f   - 프론트엔드 로그만 표시"
        echo "  both, all     - 전체 로그 표시 (기본값)"
        ;;
esac
