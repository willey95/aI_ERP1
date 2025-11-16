#!/bin/bash

echo "🔄 XEM System - Docker 재시작"
echo "============================"
echo ""

echo "1️⃣  기존 컨테이너 중지..."
docker compose down

echo ""
echo "2️⃣  컨테이너 시작..."
docker compose up -d

echo ""
echo "3️⃣  컨테이너 시작 대기 (15초)..."
sleep 15

echo ""
echo "✅ 재시작 완료!"
echo ""
echo "📊 시스템 상태:"
docker compose ps

echo ""
echo "🌐 접속 정보:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   API Docs: http://localhost:3000/api/docs"
echo ""
echo "📝 로그 확인: docker compose logs -f"
