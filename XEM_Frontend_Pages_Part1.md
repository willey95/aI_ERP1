# XEM Frontend - All 9 Pages Complete Implementation
## Production-Ready React Components

**Version**: 3.0  
**License**: MIT

---

## 📁 Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx          ✅
│   │   ├── DashboardPage.tsx      ✅
│   │   ├── ProjectsPage.tsx       ✅
│   │   ├── ProjectDetailPage.tsx  ✅
│   │   ├── BudgetPage.tsx         ✅
│   │   ├── ExecutionPage.tsx      ✅
│   │   ├── ApprovalPage.tsx       ✅
│   │   ├── AnalyticsPage.tsx      ✅
│   │   ├── SimulationPage.tsx     ✅
│   │   ├── UsersPage.tsx          ✅
│   │   └── SettingsPage.tsx       ✅
│   ├── components/
│   ├── stores/
│   ├── lib/
│   └── App.tsx
```

---

## 🎨 Page 1: Login Page

### File: `frontend/src/pages/LoginPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginPage() {
  const [email, setEmail] = useState('staff1@xem.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogins = [
    { email: 'admin@xem.com', name: '관리자' },
    { email: 'cfo@xem.com', name: 'CFO' },
    { email: 'teamlead@xem.com', name: '팀장' },
    { email: 'staff1@xem.com', name: '담당자1' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-bold text-blue-600">
            XEM System
          </CardTitle>
          <CardDescription className="text-center text-base">
            Execution & Expenditure Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">이메일</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                빠른 로그인 (테스트용)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map((user) => (
              <Button
                key={user.email}
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail(user.email);
                  setPassword('password123');
                }}
              >
                {user.name}
              </Button>
            ))}
          </div>

          <p className="text-xs text-center text-gray-500">
            기본 비밀번호: password123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📊 Page 2: Dashboard Page

### File: `frontend/src/pages/DashboardPage.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/stats`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-500 mt-1">실시간 프로젝트 현황 및 주요 지표</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            리포트 다운로드
          </Button>
          <Button>
            신규 프로젝트
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 프로젝트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
                <p className="text-sm text-gray-500 mt-1">진행중 프로젝트</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 예산
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {((stats?.totalBudget || 0) / 100000000).toFixed(0)}억원
                </div>
                <p className="text-sm text-gray-500 mt-1">전체 프로젝트 합계</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              평균 집행률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {(stats?.avgExecutionRate || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500 mt-1">전체 평균</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              대기 결재
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold text-red-600">
                  {stats?.pendingApprovals || 0}
                </div>
                <p className="text-sm text-gray-500 mt-1">승인 대기중</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>최근 집행 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentExecutions?.slice(0, 5).map((execution: any) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{execution.project.name}</p>
                    <p className="text-sm text-gray-500">
                      {execution.budgetItem.mainItem}
                      {execution.budgetItem.subItem && ` - ${execution.budgetItem.subItem}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(execution.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg">
                      {(execution.amount / 100000000).toFixed(1)}억원
                    </p>
                    <Badge
                      variant={
                        execution.status === 'APPROVED'
                          ? 'success'
                          : execution.status === 'PENDING'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="mt-1"
                    >
                      {execution.status === 'APPROVED' && '승인완료'}
                      {execution.status === 'PENDING' && '승인대기'}
                      {execution.status === 'REJECTED' && '반려'}
                      {execution.status === 'DRAFT' && '작성중'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>리스크 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.riskAlerts?.slice(0, 5).map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'DANGER'
                      ? 'bg-orange-50 border-orange-200'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {alert.severity === 'CRITICAL' && (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <p className="font-medium">{alert.title}</p>
                      </div>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        alert.severity === 'CRITICAL' || alert.severity === 'DANGER'
                          ? 'destructive'
                          : alert.severity === 'WARNING'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {(!stats?.riskAlerts || stats.riskAlerts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>현재 리스크 알림이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">이번 달 집행액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.monthlyExecution || 0) / 100000000).toFixed(0)}억원
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">전월 대비</span>
              <Badge variant={stats?.monthlyChange >= 0 ? 'success' : 'destructive'}>
                {stats?.monthlyChange >= 0 ? '+' : ''}
                {(stats?.monthlyChange || 0).toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">평균 결재 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.avgApprovalTime || 0).toFixed(1)}시간
            </div>
            <p className="text-xs text-gray-500 mt-2">최근 30일 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">높은 리스크 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.highRiskProjects || 0}개
            </div>
            <p className="text-xs text-gray-500 mt-2">리스크 점수 70 이상</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 📁 Page 3: Projects Page

### File: `frontend/src/pages/ProjectsPage.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { Search, Plus, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', statusFilter, typeFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('projectType', typeFilter);
      if (search) params.append('search', search);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/projects?${params.toString()}`
      );
      return response.data;
    },
  });

  const getExecutionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-50';
    if (rate >= 75) return 'text-orange-600 bg-orange-50';
    if (rate >= 65) return 'text-amber-600 bg-amber-50';
    if (rate >= 50) return 'text-lime-600 bg-lime-50';
    return 'text-green-600 bg-green-50';
  };

  const getExecutionRateLabel = (rate: number) => {
    if (rate >= 90) return '긴급';
    if (rate >= 75) return '위험';
    if (rate >= 65) return '주의';
    if (rate >= 50) return '양호';
    return '정상';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'warning';
    return 'default';
  };

  if (isLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-gray-500 mt-1">전체 {projects?.length || 0}개 프로젝트</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          신규 프로젝트
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="프로젝트명 또는 위치로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="PLANNING">기획중</SelectItem>
                <SelectItem value="ACTIVE">진행중</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="SUSPENDED">중단</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="SELF">자체사업</SelectItem>
                <SelectItem value="SPC">SPC사업</SelectItem>
                <SelectItem value="JOINT">공동사업</SelectItem>
                <SelectItem value="COOPERATIVE">협력사업</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project: any) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{project.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </div>
                </div>
                <Badge variant={getRiskBadgeColor(project.riskScore)}>
                  Risk {project.riskScore}
                </Badge>
              </div>

              {/* Status & Type */}
              <div className="flex gap-2 mb-4">
                <Badge variant="outline">
                  {project.status === 'PLANNING' && '기획중'}
                  {project.status === 'ACTIVE' && '진행중'}
                  {project.status === 'COMPLETED' && '완료'}
                  {project.status === 'SUSPENDED' && '중단'}
                </Badge>
                <Badge variant="secondary">
                  {project.projectType === 'SELF' && '자체'}
                  {project.projectType === 'SPC' && 'SPC'}
                  {project.projectType === 'JOINT' && '공동'}
                  {project.projectType === 'COOPERATIVE' && '협력'}
                </Badge>
              </div>

              {/* Budget Info */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">총 예산</span>
                  <span className="font-semibold">
                    {(parseFloat(project.currentBudget) / 100000000).toFixed(0)}억원
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">집행액</span>
                  <span className="font-semibold">
                    {(parseFloat(project.executedAmount) / 100000000).toFixed(0)}억원
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">잔액</span>
                  <span className="font-semibold">
                    {(parseFloat(project.remainingBudget) / 100000000).toFixed(0)}억원
                  </span>
                </div>
              </div>

              {/* Execution Rate */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">집행률</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {project.executionRate.toFixed(1)}%
                    </span>
                    <Badge
                      className={getExecutionRateColor(project.executionRate)}
                      variant="outline"
                    >
                      {getExecutionRateLabel(project.executionRate)}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={project.executionRate}
                  className="h-2"
                  indicatorClassName={
                    project.executionRate >= 90
                      ? 'bg-red-500'
                      : project.executionRate >= 75
                      ? 'bg-orange-500'
                      : project.executionRate >= 65
                      ? 'bg-amber-500'
                      : project.executionRate >= 50
                      ? 'bg-lime-500'
                      : 'bg-green-500'
                  }
                />
              </div>

              {/* Footer Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">세대수</div>
                  <div className="font-semibold">{project.units}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">ROI</div>
                  <div className="font-semibold flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    {project.roi.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">준공</div>
                  <div className="font-semibold text-xs">
                    {project.completionDate
                      ? new Date(project.completionDate).toLocaleDateString('ko-KR', {
                          year: '2-digit',
                          month: '2-digit',
                        })
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {projects?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">조건에 맞는 프로젝트가 없습니다.</p>
            <Button className="mt-4" onClick={() => navigate('/projects/new')}>
              <Plus className="w-4 h-4 mr-2" />
              첫 프로젝트 생성하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

Due to the length limit, I'll create the remaining pages in the next file. Would you like me to continue with:

4. Project Detail Page (Dashboard Modal)
5. Budget Management Page
6. Execution Management Page
7. Approval Page
8. Analytics Page
9. Simulation Page
10. Users Page
11. Settings Page

Plus the complete App routing and final integration?
