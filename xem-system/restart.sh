#!/bin/bash

# XEM System - 재시작 스크립트
# 사용법: ./restart.sh

echo "🔄 XEM System 재시작 중..."
echo ""

# 중지
./stop.sh

echo ""
echo "⏳ 3초 대기 중..."
sleep 3
echo ""

# 시작
./start.sh $@
