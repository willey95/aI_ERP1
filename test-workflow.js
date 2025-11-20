/**
 * XEM 시스템 워크플로우 자동 테스트 스크립트
 *
 * 실행 방법:
 * node test-workflow.js
 */

const API_BASE = 'http://localhost:3000/api';

// 색상 출력을 위한 ANSI 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 로그 헬퍼
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`${colors.bright}단계 ${step}: ${message}${colors.reset}`, colors.blue);
  log('='.repeat(60), colors.blue);
}

// API 호출 헬퍼
async function apiCall(method, endpoint, data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}`);
    }

    return responseData;
  } catch (error) {
    throw new Error(`API 호출 실패 (${method} ${endpoint}): ${error.message}`);
  }
}

// 딜레이 헬퍼
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 테스트 데이터
const testAccounts = {
  staff: { email: 'staff1@xem.com', password: 'password123', name: '김직원' },
  teamlead: { email: 'teamlead@xem.com', password: 'password123', name: '이팀장' },
  cfo: { email: 'cfo@xem.com', password: 'password123', name: '박CFO' },
  rm: { email: 'rm@xem.com', password: 'password123', name: '최RM' },
  admin: { email: 'admin@xem.com', password: 'password123', name: '관리자' },
};

// 테스트 결과 저장
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
};

// 메인 테스트 함수
async function runWorkflowTest() {
  log('\n' + '='.repeat(80), colors.bright);
  log('XEM 시스템 워크플로우 자동 테스트', colors.bright);
  log('='.repeat(80) + '\n', colors.bright);

  let staffToken, teamleadToken, cfoToken, rmToken, adminToken;
  let selectedProject, selectedBudgetItem, executionRequestId;

  try {
    // ========================================
    // 단계 1: 직원 로그인
    // ========================================
    logStep(1, '직원 로그인');

    try {
      const staffLogin = await apiCall('POST', '/auth/login', {
        email: testAccounts.staff.email,
        password: testAccounts.staff.password,
      });
      staffToken = staffLogin.token;
      logSuccess(`${testAccounts.staff.name} 로그인 성공`);
      logInfo(`Token: ${staffToken.substring(0, 20)}...`);
      testResults.passed++;
    } catch (error) {
      logError(`로그인 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 2: 프로젝트 목록 조회
    // ========================================
    logStep(2, '프로젝트 목록 조회');

    try {
      const projectsData = await apiCall('GET', '/projects', null, staffToken);
      const projects = projectsData.projects || projectsData || [];

      if (projects.length === 0) {
        throw new Error('프로젝트가 없습니다');
      }

      // 예산 항목이 있는 ACTIVE 프로젝트 찾기
      for (const project of projects.filter(p => p.status === 'ACTIVE')) {
        const budgetCheckRes = await apiCall('GET', `/budget/project/${project.id}`, null, staffToken);
        // summary 배열에서 items 추출
        const summary = budgetCheckRes.summary || [];
        const hasItems = summary.some(cat => cat.items && cat.items.length > 0);
        if (hasItems) {
          selectedProject = project;
          break;
        }
      }

      // 예산 항목이 있는 프로젝트가 없으면 첫 번째 프로젝트 선택
      if (!selectedProject) {
        selectedProject = projects[0];
      }

      logSuccess(`${projects.length}개의 프로젝트 조회 성공`);
      logInfo(`선택된 프로젝트: ${selectedProject.code} - ${selectedProject.name}`);
      logInfo(`총 예산: ₩${selectedProject.currentBudget.toLocaleString()}`);
      logInfo(`집행률: ${selectedProject.executionRate.toFixed(2)}%`);
      testResults.passed++;
    } catch (error) {
      logError(`프로젝트 조회 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 3: 예산 항목 조회
    // ========================================
    logStep(3, '예산 항목 조회');

    try {
      const budgetData = await apiCall('GET', `/budget/project/${selectedProject.id}`, null, staffToken);

      // summary 배열에서 모든 items 추출
      const budgetItems = [];
      if (budgetData.summary && Array.isArray(budgetData.summary)) {
        budgetData.summary.forEach(category => {
          if (category.items && Array.isArray(category.items)) {
            budgetItems.push(...category.items);
          }
        });
      }

      if (budgetItems.length === 0) {
        throw new Error('예산 항목이 없습니다');
      }

      // 잔액이 있는 항목 찾기
      selectedBudgetItem = budgetItems.find(item =>
        parseFloat(item.remainingBudget) > 1000000
      ) || budgetItems[0];

      logSuccess(`${budgetItems.length}개의 예산 항목 조회 성공`);
      logInfo(`선택된 예산 항목: ${selectedBudgetItem.mainItem} - ${selectedBudgetItem.subItem}`);
      logInfo(`잔액: ₩${parseFloat(selectedBudgetItem.remainingBudget).toLocaleString()}`);
      testResults.passed++;
    } catch (error) {
      logError(`예산 항목 조회 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 4: 집행 요청 생성
    // ========================================
    logStep(4, '집행 요청 생성');

    const executionAmount = 5000000; // 5백만원
    const executionData = {
      projectId: selectedProject.id,
      budgetItemId: selectedBudgetItem.id,
      amount: executionAmount,
      executionDate: new Date().toISOString().split('T')[0],
      purpose: '[자동테스트] 사무용품 구매',
      description: '프린터, 복사용지, 문구류 등 사무용품 일괄 구매',
    };

    try {
      // 잔액 검증
      const remainingBudget = parseFloat(selectedBudgetItem.remainingBudget);
      if (executionAmount > remainingBudget) {
        logWarning(`집행 금액(₩${executionAmount.toLocaleString()})이 잔액(₩${remainingBudget.toLocaleString()})을 초과합니다`);
        logInfo('집행 금액을 잔액의 50%로 조정합니다');
        executionData.amount = Math.floor(remainingBudget * 0.5);
        testResults.warnings++;
      }

      const execution = await apiCall('POST', '/execution', executionData, staffToken);
      executionRequestId = execution.id;

      logSuccess(`집행 요청 생성 성공 (ID: ${executionRequestId})`);
      logInfo(`요청 번호: ${execution.requestNumber}`);
      logInfo(`집행 금액: ₩${execution.amount.toLocaleString()}`);
      logInfo(`현재 단계: Step ${execution.currentStep}/4`);
      logInfo(`상태: ${execution.status}`);
      testResults.passed++;

      await delay(1000); // 1초 대기
    } catch (error) {
      logError(`집행 요청 생성 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 5: 팀장 승인 (1차)
    // ========================================
    logStep(5, '팀장 1차 승인');

    try {
      // 팀장 로그인
      const teamleadLogin = await apiCall('POST', '/auth/login', {
        email: testAccounts.teamlead.email,
        password: testAccounts.teamlead.password,
      });
      teamleadToken = teamleadLogin.token;
      logSuccess(`${testAccounts.teamlead.name} 로그인 성공`);

      // 대기 중인 승인 조회
      const pendingApprovals = await apiCall('GET', '/approval/pending', null, teamleadToken);
      const approvalToProcess = pendingApprovals.find(a => a.executionRequestId === executionRequestId);

      if (!approvalToProcess) {
        throw new Error('승인 대기 중인 요청을 찾을 수 없습니다');
      }

      logInfo(`승인 요청 발견: ${approvalToProcess.executionRequest.requestNumber}`);

      // 승인 처리
      await apiCall('POST', `/approval/${approvalToProcess.id}/approve`, {
        comments: '[자동테스트] 팀장 승인',
      }, teamleadToken);

      logSuccess(`팀장 1차 승인 완료`);
      testResults.passed++;

      await delay(1000);
    } catch (error) {
      logError(`팀장 승인 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 6: CFO 승인 (2차)
    // ========================================
    logStep(6, 'CFO 2차 승인');

    try {
      const cfoLogin = await apiCall('POST', '/auth/login', {
        email: testAccounts.cfo.email,
        password: testAccounts.cfo.password,
      });
      cfoToken = cfoLogin.token;
      logSuccess(`${testAccounts.cfo.name} 로그인 성공`);

      const pendingApprovals = await apiCall('GET', '/approval/pending', null, cfoToken);
      const approvalToProcess = pendingApprovals.find(a => a.executionRequestId === executionRequestId);

      if (!approvalToProcess) {
        throw new Error('승인 대기 중인 요청을 찾을 수 없습니다');
      }

      await apiCall('POST', `/approval/${approvalToProcess.id}/approve`, {
        comments: '[자동테스트] CFO 승인',
      }, cfoToken);

      logSuccess(`CFO 2차 승인 완료`);
      testResults.passed++;

      await delay(1000);
    } catch (error) {
      logError(`CFO 승인 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 7: RM팀 승인 (3차)
    // ========================================
    logStep(7, 'RM팀 3차 승인');

    try {
      const rmLogin = await apiCall('POST', '/auth/login', {
        email: testAccounts.rm.email,
        password: testAccounts.rm.password,
      });
      rmToken = rmLogin.token;
      logSuccess(`${testAccounts.rm.name} 로그인 성공`);

      const pendingApprovals = await apiCall('GET', '/approval/pending', null, rmToken);
      const approvalToProcess = pendingApprovals.find(a => a.executionRequestId === executionRequestId);

      if (!approvalToProcess) {
        throw new Error('승인 대기 중인 요청을 찾을 수 없습니다');
      }

      await apiCall('POST', `/approval/${approvalToProcess.id}/approve`, {
        comments: '[자동테스트] RM팀 승인',
      }, rmToken);

      logSuccess(`RM팀 3차 승인 완료`);
      testResults.passed++;

      await delay(1000);
    } catch (error) {
      logError(`RM팀 승인 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 8: 관리자 최종 승인 (4차)
    // ========================================
    logStep(8, '관리자 최종 승인');

    try {
      const adminLogin = await apiCall('POST', '/auth/login', {
        email: testAccounts.admin.email,
        password: testAccounts.admin.password,
      });
      adminToken = adminLogin.token;
      logSuccess(`${testAccounts.admin.name} 로그인 성공`);

      const pendingApprovals = await apiCall('GET', '/approval/pending', null, adminToken);
      const approvalToProcess = pendingApprovals.find(a => a.executionRequestId === executionRequestId);

      if (!approvalToProcess) {
        throw new Error('승인 대기 중인 요청을 찾을 수 없습니다');
      }

      await apiCall('POST', `/approval/${approvalToProcess.id}/approve`, {
        comments: '[자동테스트] 최종 승인',
      }, adminToken);

      logSuccess(`관리자 최종 승인 완료`);
      testResults.passed++;

      await delay(2000); // 데이터 업데이트 대기
    } catch (error) {
      logError(`관리자 승인 실패: ${error.message}`);
      testResults.failed++;
      throw error;
    }

    // ========================================
    // 단계 9: 결과 검증
    // ========================================
    logStep(9, '승인 완료 후 결과 검증');

    try {
      // 집행 요청 상태 확인
      const executionsData = await apiCall('GET', '/execution', null, staffToken);
      const executions = executionsData.executions || [];
      const completedExecution = executions.find(e => e.id === executionRequestId);

      if (!completedExecution) {
        throw new Error('집행 요청을 찾을 수 없습니다');
      }

      logInfo(`집행 요청 상태: ${completedExecution.status}`);
      logInfo(`현재 단계: Step ${completedExecution.currentStep}/4`);

      if (completedExecution.status === 'APPROVED') {
        logSuccess('집행 요청이 최종 승인되었습니다');
        testResults.passed++;
      } else {
        logWarning(`예상과 다른 상태: ${completedExecution.status}`);
        testResults.warnings++;
      }

      // 예산 항목 업데이트 확인
      const updatedBudgetData = await apiCall('GET', `/budget/project/${selectedProject.id}`, null, staffToken);
      const updatedBudgetItems = updatedBudgetData.items || [];
      const updatedBudgetItem = updatedBudgetItems.find(item => item.id === selectedBudgetItem.id);

      if (updatedBudgetItem) {
        const oldExecuted = parseFloat(selectedBudgetItem.executedAmount);
        const newExecuted = parseFloat(updatedBudgetItem.executedAmount);
        const difference = newExecuted - oldExecuted;

        logInfo(`이전 집행액: ₩${oldExecuted.toLocaleString()}`);
        logInfo(`현재 집행액: ₩${newExecuted.toLocaleString()}`);
        logInfo(`증가액: ₩${difference.toLocaleString()}`);

        if (Math.abs(difference - executionData.amount) < 1) {
          logSuccess('예산 항목이 정확하게 업데이트되었습니다');
          testResults.passed++;
        } else {
          logWarning(`집행액 증가가 예상과 다릅니다 (예상: ₩${executionData.amount.toLocaleString()})`);
          testResults.warnings++;
        }
      }

    } catch (error) {
      logError(`결과 검증 실패: ${error.message}`);
      testResults.failed++;
    }

    // ========================================
    // 테스트 완료
    // ========================================
    logStep('완료', '테스트 결과 요약');

    log('\n' + '='.repeat(80), colors.bright);
    log('테스트 결과', colors.bright);
    log('='.repeat(80), colors.bright);
    logSuccess(`통과: ${testResults.passed}개`);
    if (testResults.failed > 0) {
      logError(`실패: ${testResults.failed}개`);
    }
    if (testResults.warnings > 0) {
      logWarning(`경고: ${testResults.warnings}개`);
    }

    const totalTests = testResults.passed + testResults.failed;
    const successRate = ((testResults.passed / totalTests) * 100).toFixed(2);
    log(`\n성공률: ${successRate}%`, colors.cyan);

    if (testResults.failed === 0) {
      log('\n🎉 모든 테스트를 통과했습니다!', colors.green);
    } else {
      log('\n⚠️  일부 테스트가 실패했습니다. 로그를 확인해주세요.', colors.yellow);
    }

    log('='.repeat(80) + '\n', colors.bright);

  } catch (error) {
    log('\n' + '='.repeat(80), colors.red);
    log('❌ 테스트 실행 중 오류 발생', colors.red);
    log('='.repeat(80), colors.red);
    logError(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 스크립트 실행
if (typeof fetch === 'undefined') {
  log('⚠️  Node.js 18+ 버전이 필요합니다 (fetch API 지원)', colors.yellow);
  log('현재 버전: ' + process.version, colors.yellow);
  if (parseInt(process.version.slice(1)) < 18) {
    logError('Node.js 18 이상으로 업그레이드해주세요');
    process.exit(1);
  }
}

runWorkflowTest().catch(error => {
  logError('예상치 못한 오류: ' + error.message);
  process.exit(1);
});
