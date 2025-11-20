#!/bin/bash

echo "🔄 XEM System - Docker 완전 초기화"
echo "=================================="
echo ""
echo "⚠️  경고: 모든 데이터가 삭제됩니다!"
echo ""
read -p "계속하시겠습니까? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 취소되었습니다."
    exit 1
fi

echo ""
echo "1️⃣  기존 컨테이너 중지 및 제거..."
docker compose down -v

echo ""
echo "2️⃣  Docker 이미지 제거..."
docker rmi xem-system-backend xem-system-frontend 2>/dev/null || true

echo ""
echo "3️⃣  Docker 볼륨 제거..."
docker volume rm xem-system_postgres_data 2>/dev/null || true

echo ""
echo "4️⃣  컨테이너 재빌드 및 시작..."
docker compose up -d --build

echo ""
echo "5️⃣  컨테이너 시작 대기 (30초)..."
sleep 30

echo ""
echo "6️⃣  Seed 데이터 적용..."
docker compose exec backend npm run seed

echo ""
echo "✅ 초기화 완료!"
echo ""
echo "📊 시스템 상태:"
docker compose ps

echo ""
echo "🌐 접속 정보:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   API Docs: http://localhost:3000/api/docs"
echo "   Health:   http://localhost:3000/api/health"
echo ""
echo "👤 테스트 계정:"
echo "   approver1@xem.com / password123 (승인권자)"
echo "   staff1@xem.com / password123 (담당자)"
echo ""
echo "📝 로그 확인: docker compose logs -f"
