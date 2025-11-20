async function seedBudgetData() {
  try {
    // 1. Login as admin (has more permissions)
    console.log('1. Logging in as admin...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@xem.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
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

    // 3. Create budget items via POST API
    console.log('\n3. Creating budget items...');
    const budgetItems = [
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

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < budgetItems.length; i++) {
      const item = budgetItems[i];
      const payload = {
        ...item,
        projectId: project.id
      };

      try {
        const createRes = await fetch('http://localhost:3000/api/budget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (createRes.ok) {
          const created = await createRes.json();
          console.log(`  ✅ [${i+1}/${budgetItems.length}] Created: ${item.category} > ${item.mainItem} > ${item.subItem}`);
          successCount++;
        } else {
          const error = await createRes.json();
          console.log(`  ❌ [${i+1}/${budgetItems.length}] Failed: ${item.subItem} - ${error.message || JSON.stringify(error)}`);
          errorCount++;
        }
      } catch (err) {
        console.log(`  ❌ [${i+1}/${budgetItems.length}] Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Created ${successCount} budget items`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} items failed`);
    }

    // 4. Verify budget items were created
    console.log('\n4. Verifying budget items...');
    const budgetRes = await fetch(`http://localhost:3000/api/budget/project/${project.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const budgetData = await budgetRes.json();

    const totalItems = budgetData.summary.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
    console.log(`✅ Total budget items: ${totalItems}`);
    console.log(`   Categories: ${budgetData.summary.length}`);
    console.log(`   Total Budget: ₩${Number(budgetData.grandTotals.currentBudget).toLocaleString()}`);

    console.log('\n========================================');
    console.log('✅ Budget seeding completed!');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

seedBudgetData();
