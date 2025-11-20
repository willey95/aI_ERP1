const ExcelJS = require('exceljs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createAndImportBudget() {
  try {
    // 1. Login as staff1
    console.log('1. Logging in as staff1@xem.com...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff1@xem.com', password: 'password123' })
    });
    const { token } = await loginRes.json();
    console.log('✅ Login successful');

    // 2. Get active project
    console.log('\n2. Getting active project...');
    const projectsRes = await fetch('http://localhost:3000/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const projects = await projectsRes.json();
    const project = projects.find(p => p.status === 'ACTIVE');

    if (!project) {
      throw new Error('No active project found');
    }
    console.log(`✅ Found project: ${project.name} (${project.code})`);

    // 3. Create Excel file with budget data
    console.log('\n3. Creating Excel file with budget data...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('예산 템플릿');

    worksheet.columns = [
      { header: '카테고리', key: 'category', width: 20 },
      { header: '대항목', key: 'mainItem', width: 30 },
      { header: '세부항목', key: 'subItem', width: 30 },
      { header: '예산액 (원)', key: 'currentBudget', width: 20 },
    ];

    const budgetData = [
      { category: '인건비', mainItem: '급여', subItem: '정규직 급여', currentBudget: 50000000 },
      { category: '인건비', mainItem: '급여', subItem: '계약직 급여', currentBudget: 30000000 },
      { category: '인건비', mainItem: '수당', subItem: '초과근무수당', currentBudget: 15000000 },
      { category: '재료비', mainItem: '원자재', subItem: '철근', currentBudget: 100000000 },
      { category: '재료비', mainItem: '원자재', subItem: '시멘트', currentBudget: 80000000 },
      { category: '재료비', mainItem: '부자재', subItem: '기타자재', currentBudget: 30000000 },
      { category: '경비', mainItem: '사무용품', subItem: '문구류', currentBudget: 5000000 },
      { category: '경비', mainItem: '운영비', subItem: '통신비', currentBudget: 3000000 },
      { category: '경비', mainItem: '운영비', subItem: '전기료', currentBudget: 10000000 },
      { category: '경비', mainItem: '운영비', subItem: '수도료', currentBudget: 5000000 },
    ];

    budgetData.forEach(row => worksheet.addRow(row));
    console.log(`✅ Created Excel with ${budgetData.length} budget items`);

    // 4. Convert workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 5. Upload Excel file via import API
    console.log('\n4. Uploading Excel file to import budget items...');

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', Buffer.from(buffer), {
      filename: 'budget_import.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const importRes = await fetch(`http://localhost:3000/api/budget/excel/import/${project.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const importResult = await importRes.json();

    if (importResult.success) {
      console.log(`✅ Successfully imported ${importResult.created} budget items`);
    } else {
      console.log(`⚠️  Import completed with errors:`);
      console.log(`   Created: ${importResult.created} items`);
      console.log(`   Errors:`, importResult.errors);
    }

    // 6. Verify budget items were created
    console.log('\n5. Verifying budget items...');
    const budgetRes = await fetch(`http://localhost:3000/api/budget/project/${project.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const budgetData2 = await budgetRes.json();

    const totalItems = budgetData2.summary.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
    console.log(`✅ Found ${totalItems} budget items in ${budgetData2.summary.length} categories`);
    console.log(`   Total Budget: ₩${Number(budgetData2.grandTotals.currentBudget).toLocaleString()}`);

    console.log('\n========================================');
    console.log('✅ Budget items created successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

createAndImportBudget();
