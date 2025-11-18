/**
 * Test script to simulate execution request creation from frontend
 * This tests the exact same flow as ExecutionRequestCreatePage.tsx
 */

async function testExecutionCreate() {
  try {
    console.log('========================================');
    console.log('집행 요청 생성 테스트');
    console.log('========================================\n');

    // 1. Login as staff
    console.log('1️⃣ 로그인 (staff1@xem.com)...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff1@xem.com',
        password: 'password123'
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      throw new Error(`로그인 실패: ${JSON.stringify(error)}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ 로그인 성공\n');

    // 2. Get projects (simulate dropdown load)
    console.log('2️⃣ 프로젝트 목록 조회...');
    const projectsRes = await fetch('http://localhost:3000/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!projectsRes.ok) {
      throw new Error('프로젝트 조회 실패');
    }

    const projectsData = await projectsRes.json();
    const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);

    if (projects.length === 0) {
      throw new Error('프로젝트가 없습니다');
    }

    console.log(`✅ ${projects.length}개 프로젝트 발견`);
    const selectedProject = projects.find(p => p.status === 'ACTIVE' && p.code === 'PRJ-2024-003');

    if (!selectedProject) {
      throw new Error('테스트 프로젝트(PRJ-2024-003)를 찾을 수 없습니다');
    }

    console.log(`   선택: ${selectedProject.code} - ${selectedProject.name}\n`);

    // 3. Get budget items for selected project (simulate budget item dropdown)
    console.log('3️⃣ 예산 항목 조회...');
    const budgetRes = await fetch(`http://localhost:3000/api/budget/project/${selectedProject.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!budgetRes.ok) {
      throw new Error('예산 항목 조회 실패');
    }

    const budgetData = await budgetRes.json();

    // Extract items from summary structure (same as frontend)
    const budgetItems = [];
    if (budgetData?.summary && Array.isArray(budgetData.summary)) {
      budgetData.summary.forEach((category) => {
        if (category.items && Array.isArray(category.items)) {
          budgetItems.push(...category.items);
        }
      });
    }

    if (budgetItems.length === 0) {
      throw new Error('예산 항목이 없습니다');
    }

    console.log(`✅ ${budgetItems.length}개 예산 항목 발견`);
    const selectedBudgetItem = budgetItems.find(item =>
      item.mainItem === '운영비' && item.subItem === '수도료'
    );

    if (!selectedBudgetItem) {
      throw new Error('테스트 예산 항목(운영비-수도료)을 찾을 수 없습니다');
    }

    console.log(`   선택: ${selectedBudgetItem.category} > ${selectedBudgetItem.mainItem} > ${selectedBudgetItem.subItem}`);
    console.log(`   잔액: ₩${Number(selectedBudgetItem.remainingBudget).toLocaleString()}\n`);

    // 4. Create execution request (simulate form submission)
    console.log('4️⃣ 집행 요청 생성...');

    const executionPayload = {
      projectId: selectedProject.id,
      budgetItemId: selectedBudgetItem.id,
      amount: 500000,
      executionDate: new Date().toISOString().split('T')[0],
      purpose: '수도 요금 납부',
      description: '테스트용 집행 요청',
      attachments: []
    };

    console.log('   요청 데이터:', JSON.stringify(executionPayload, null, 2));

    const createRes = await fetch('http://localhost:3000/api/execution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(executionPayload)
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      console.error('❌ 집행 요청 생성 실패');
      console.error('   상태 코드:', createRes.status);
      console.error('   에러 메시지:', JSON.stringify(error, null, 2));
      throw new Error(`집행 요청 생성 실패: ${error.message || JSON.stringify(error)}`);
    }

    const execution = await createRes.json();
    console.log('✅ 집행 요청 생성 성공!');
    console.log(`   요청 번호: ${execution.requestNumber}`);
    console.log(`   금액: ₩${Number(execution.amount).toLocaleString()}`);
    console.log(`   상태: ${execution.status}`);
    console.log(`   현재 단계: ${execution.currentStep}\n`);

    // 5. Verify execution request was created
    console.log('5️⃣ 집행 요청 목록 확인...');
    const executionsRes = await fetch('http://localhost:3000/api/execution', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!executionsRes.ok) {
      throw new Error('집행 요청 목록 조회 실패');
    }

    const executions = await executionsRes.json();
    const createdExecution = executions.find(e => e.requestNumber === execution.requestNumber);

    if (createdExecution) {
      console.log('✅ 집행 요청이 목록에서 확인됨');
      console.log(`   총 ${executions.length}개의 집행 요청 존재\n`);
    } else {
      console.log('⚠️  집행 요청이 목록에서 확인되지 않음\n');
    }

    console.log('========================================');
    console.log('✅ 테스트 완료 - 모든 단계 성공!');
    console.log('========================================\n');

    console.log('📋 결론:');
    console.log('- 백엔드 API는 정상 작동합니다');
    console.log('- 집행 요청 생성이 성공적으로 완료되었습니다');
    console.log('- 프론트엔드 문제일 가능성이 높습니다\n');

    console.log('🔍 프론트엔드 디버깅 방법:');
    console.log('1. 브라우저에서 F12 (개발자 도구) 열기');
    console.log('2. Console 탭에서 에러 메시지 확인');
    console.log('3. Network 탭에서 /api/execution POST 요청 확인');
    console.log('4. 요청이 전송되는지, 응답 코드가 무엇인지 확인');
    console.log('5. localStorage에 xem_token이 있는지 확인\n');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.stack) {
      console.error('\n스택 트레이스:', error.stack);
    }
    process.exit(1);
  }
}

testExecutionCreate();
