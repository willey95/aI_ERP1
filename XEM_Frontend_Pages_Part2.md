# XEM Frontend - Remaining Pages & Integration
## Complete All Pages + App Router

**Version**: 3.0  
**License**: MIT

---

## 📄 Page 4: Budget Management Page

### File: `frontend/src/pages/BudgetPage.tsx`

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { Edit2, TrendingUp, TrendingDown } from 'lucide-react';

export function BudgetPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newBudget, setNewBudget] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects`);
      return response.data;
    },
  });

  // Fetch budget data
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/budget/project/${selectedProjectId}`
      );
      return response.data;
    },
    enabled: !!selectedProjectId,
  });

  // Budget change mutation
  const changeBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/budget/change`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      setEditDialogOpen(false);
      setEditingItem(null);
      setNewBudget('');
      setChangeReason('');
    },
  });

  const handleEditBudget = (item: any) => {
    setEditingItem(item);
    setNewBudget((parseFloat(item.currentBudget) / 100000000).toString());
    setEditDialogOpen(true);
  };

  const handleSaveBudgetChange = () => {
    if (!editingItem || !newBudget || !changeReason) return;

    changeBudgetMutation.mutate({
      id: editingItem.id,
      newBudget: parseFloat(newBudget) * 100000000,
      changeReason,
    });
  };

  const getExecutionRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-100 text-red-700';
    if (rate >= 75) return 'bg-orange-100 text-orange-700';
    if (rate >= 65) return 'bg-amber-100 text-amber-700';
    if (rate >= 50) return 'bg-lime-100 text-lime-700';
    return 'bg-green-100 text-green-700';
  };

  const formatCurrency = (value: any) => {
    return (parseFloat(value) / 100000000).toFixed(1);
  };

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">예산 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">프로젝트를 선택하세요</p>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-64 mx-auto">
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Loading budget data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">예산 관리</h1>
          <div className="mt-2">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">최초 예산</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budgetData?.grandTotals?.initialBudget)}억원
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">변경 예산</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budgetData?.grandTotals?.currentBudget)}억원
            </div>
            {parseFloat(budgetData?.grandTotals?.currentBudget) !==
              parseFloat(budgetData?.grandTotals?.initialBudget) && (
              <div className="flex items-center gap-1 mt-1">
                {parseFloat(budgetData?.grandTotals?.currentBudget) >
                parseFloat(budgetData?.grandTotals?.initialBudget) ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className="text-xs text-gray-500">
                  {(
                    ((parseFloat(budgetData?.grandTotals?.currentBudget) -
                      parseFloat(budgetData?.grandTotals?.initialBudget)) /
                      parseFloat(budgetData?.grandTotals?.initialBudget)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">집행액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(budgetData?.grandTotals?.executedAmount)}억원
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">잔액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(budgetData?.grandTotals?.remainingBudget)}억원
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table by Category */}
      {budgetData?.summary?.map((category: any) => (
        <Card key={category.category}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{category.category}</CardTitle>
              <div className="text-sm text-gray-500">
                예산: {formatCurrency(category.totals.currentBudget)}억원 / 집행:{' '}
                {formatCurrency(category.totals.executedAmount)}억원 / 잔액:{' '}
                {formatCurrency(category.totals.remainingBudget)}억원
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right">최초예산</TableHead>
                  <TableHead className="text-right">변경예산</TableHead>
                  <TableHead className="text-right">집행액</TableHead>
                  <TableHead className="text-right">잔액</TableHead>
                  <TableHead className="text-center">집행률</TableHead>
                  <TableHead className="text-center">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.mainItem}
                      {item.subItem && (
                        <div className="text-xs text-gray-500 mt-1">{item.subItem}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.initialBudget)}억
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.currentBudget)}억
                      {parseFloat(item.currentBudget) !== parseFloat(item.initialBudget) && (
                        <span className="text-xs text-amber-600 ml-1">변경</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.executedAmount)}억
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.remainingBudget)}억
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getExecutionRateColor(item.executionRate)}>
                        {item.executionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBudget(item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Edit Budget Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예산 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">항목</label>
              <p className="text-sm text-gray-600">
                {editingItem?.mainItem}
                {editingItem?.subItem && ` - ${editingItem.subItem}`}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">현재 예산</label>
              <p className="text-lg font-bold">
                {editingItem && formatCurrency(editingItem.currentBudget)}억원
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">변경 예산 (억원)</label>
              <Input
                type="number"
                step="0.1"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="예: 100.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">변경 사유</label>
              <Textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="예산 변경 사유를 입력하세요"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleSaveBudgetChange}
                disabled={!newBudget || !changeReason || changeBudgetMutation.isPending}
              >
                {changeBudgetMutation.isPending ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 📝 Page 5: Execution Management Page

### File: `frontend/src/pages/ExecutionPage.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { Plus, Search, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export function ExecutionPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newRequestDialogOpen, setNewRequestDialogOpen] = useState(false);

  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/execution?${params.toString()}`
      );
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['execution-stats'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/execution/stats`
      );
      return response.data;
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      DRAFT: { label: '작성중', variant: 'secondary' },
      PENDING: { label: '승인대기', variant: 'warning' },
      APPROVED: { label: '승인완료', variant: 'success' },
      REJECTED: { label: '반려', variant: 'destructive' },
      CANCELLED: { label: '취소', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCurrentStepLabel = (step: number) => {
    const steps = ['담당자', '팀장', 'RM팀', 'CFO'];
    return steps[step - 1] || '-';
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">집행 관리</h1>
          <p className="text-gray-500 mt-1">전체 {executions?.length || 0}건</p>
        </div>
        <Button onClick={() => setNewRequestDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          신규 품의
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              이번 달 집행
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.monthlyTotal || 0) / 100000000).toFixed(0)}억원
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              작성중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats?.draftCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              승인대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.pendingCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              반려
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.rejectedCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="품의번호 또는 프로젝트명으로 검색..."
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
                <SelectItem value="DRAFT">작성중</SelectItem>
                <SelectItem value="PENDING">승인대기</SelectItem>
                <SelectItem value="APPROVED">승인완료</SelectItem>
                <SelectItem value="REJECTED">반려</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Executions Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>품의번호</TableHead>
                <TableHead>프로젝트</TableHead>
                <TableHead>예산항목</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>요청일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>현재단계</TableHead>
                <TableHead className="text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions?.map((execution: any) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">
                    {execution.requestNumber}
                  </TableCell>
                  <TableCell>{execution.project.name}</TableCell>
                  <TableCell>
                    {execution.budgetItem.mainItem}
                    {execution.budgetItem.subItem && (
                      <div className="text-xs text-gray-500">
                        {execution.budgetItem.subItem}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {(parseFloat(execution.amount) / 100000000).toFixed(1)}억원
                  </TableCell>
                  <TableCell>
                    {new Date(execution.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(execution.status)}</TableCell>
                  <TableCell>
                    {execution.status === 'PENDING' && (
                      <Badge variant="outline">
                        {getCurrentStepLabel(execution.currentStep)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="ghost" size="sm">
                        상세
                      </Button>
                      {execution.status === 'DRAFT' && (
                        <Button variant="ghost" size="sm">
                          재작성
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Execution Request Dialog */}
      <Dialog open={newRequestDialogOpen} onOpenChange={setNewRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>신규 품의서 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-500">
              신규 품의서 작성 폼이 여기에 표시됩니다.
              <br />
              (4단계 위자드: 프로젝트 선택 → 금액 입력 → 상세 내용 → 결재선)
            </p>
            <Button onClick={() => setNewRequestDialogOpen(false)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## ✅ Page 6: Approval Page

### File: `frontend/src/pages/ApprovalPage.tsx`

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ApprovalPage() {
  const { user } = useAuthStore();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const queryClient = useQueryClient();

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/approval/pending`
      );
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/approval/stats`
      );
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { id: string; decision?: string }) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/approval/${data.id}/approve`,
        { decision: data.decision }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      setApprovalDialogOpen(false);
      setDecision('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: string; decision: string }) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/approval/${data.id}/reject`,
        { decision: data.decision }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      setRejectDialogOpen(false);
      setDecision('');
    },
  });

  const handleApprove = () => {
    if (!selectedApproval) return;
    approveMutation.mutate({
      id: selectedApproval.id,
      decision,
    });
  };

  const handleReject = () => {
    if (!selectedApproval || !decision) return;
    rejectMutation.mutate({
      id: selectedApproval.id,
      decision,
    });
  };

  const getUrgencyBadge = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return <Badge variant="destructive">긴급</Badge>;
    if (hours > 24) return <Badge variant="warning">주의</Badge>;
    return null;
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const urgentApprovals = pendingApprovals?.filter((a: any) => {
    const hours = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
    return hours > 24;
  });

  const normalApprovals = pendingApprovals?.filter((a: any) => {
    const hours = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
    return hours <= 24;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">결재</h1>
        <p className="text-gray-500 mt-1">대기중인 결재 {pendingApprovals?.length || 0}건</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats?.pending || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">이번주 승인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.approvedThisWeek || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">평균 처리시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.avgProcessingTime || 0}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">반려율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.rejectionRate || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Lists */}
      <Tabs defaultValue="urgent">
        <TabsList>
          <TabsTrigger value="urgent">
            긴급 ({urgentApprovals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="normal">
            일반 ({normalApprovals?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="urgent" className="space-y-4">
          {urgentApprovals?.map((approval: any) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={() => {
                setSelectedApproval(approval);
                setApprovalDialogOpen(true);
              }}
              onReject={() => {
                setSelectedApproval(approval);
                setRejectDialogOpen(true);
              }}
            />
          ))}
          {urgentApprovals?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                긴급 결재 건이 없습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="normal" className="space-y-4">
          {normalApprovals?.map((approval: any) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={() => {
                setSelectedApproval(approval);
                setApprovalDialogOpen(true);
              }}
              onReject={() => {
                setSelectedApproval(approval);
                setRejectDialogOpen(true);
              }}
            />
          ))}
          {normalApprovals?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                일반 결재 건이 없습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 승인</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              품의번호: <strong>{selectedApproval?.executionRequest.requestNumber}</strong>
            </p>
            <p>
              금액:{' '}
              <strong>
                {selectedApproval &&
                  (
                    parseFloat(selectedApproval.executionRequest.amount) / 100000000
                  ).toFixed(1)}
                억원
              </strong>
            </p>
            <div>
              <label className="text-sm font-medium mb-2 block">승인 의견 (선택)</label>
              <Textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="승인 의견을 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? '처리중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 반려</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              품의번호: <strong>{selectedApproval?.executionRequest.requestNumber}</strong>
            </p>
            <div>
              <label className="text-sm font-medium mb-2 block">
                반려 사유 (필수) <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!decision || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApprovalCard({ approval, onApprove, onReject }: any) {
  const execution = approval.executionRequest;
  const getApprovalStatus = (approvals: any[], step: number) => {
    const approval = approvals.find((a) => a.step === step);
    if (!approval) return null;
    if (approval.status === 'APPROVED') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (approval.status === 'PENDING') return <Clock className="w-5 h-5 text-amber-500" />;
    if (approval.status === 'REJECTED') return <XCircle className="w-5 h-5 text-red-500" />;
    return null;
  };

  const hours = (Date.now() - new Date(approval.createdAt).getTime()) / (1000 * 60 * 60);
  const isUrgent = hours > 48;

  return (
    <Card className={isUrgent ? 'border-red-300 bg-red-50/30' : ''}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold">{execution.requestNumber}</h3>
              {isUrgent && <Badge variant="destructive">긴급</Badge>}
            </div>
            <p className="text-sm text-gray-600">{execution.project.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {(parseFloat(execution.amount) / 100000000).toFixed(1)}억원
            </div>
            <p className="text-sm text-gray-500">{execution.budgetItem.mainItem}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-1">집행 사유:</p>
          <p className="text-sm text-gray-600">{execution.purpose}</p>
        </div>

        {/* Approval Flow */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="text-center flex-1">
            <div className="flex justify-center mb-1">
              {getApprovalStatus(execution.approvals, 1)}
            </div>
            <p className="text-xs text-gray-500">담당자</p>
          </div>
          <div className="h-px bg-gray-300 flex-1 mx-2" />
          <div className="text-center flex-1">
            <div className="flex justify-center mb-1">
              {getApprovalStatus(execution.approvals, 2)}
            </div>
            <p className="text-xs text-gray-500">팀장</p>
          </div>
          <div className="h-px bg-gray-300 flex-1 mx-2" />
          <div className="text-center flex-1">
            <div className="flex justify-center mb-1">
              {getApprovalStatus(execution.approvals, 3)}
            </div>
            <p className="text-xs text-gray-500">RM팀</p>
          </div>
          <div className="h-px bg-gray-300 flex-1 mx-2" />
          <div className="text-center flex-1">
            <div className="flex justify-center mb-1">
              {getApprovalStatus(execution.approvals, 4)}
            </div>
            <p className="text-xs text-gray-500">CFO</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => {}}>
            상세보기
          </Button>
          <Button variant="destructive" onClick={onReject}>
            반려
          </Button>
          <Button onClick={onApprove}>승인</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

Due to length, I'll create the remaining pages (Analytics, Simulation, Users, Settings) and final App integration in one more file.

[View complete implementation in outputs folder](computer:///mnt/user-data/outputs)

**Created Files:**
1. [XEM_Complete_Implementation_Guide.md](computer:///mnt/user-data/outputs/XEM_Complete_Implementation_Guide.md) - 완전한 구현 가이드
2. [XEM_Backend_API_Complete.md](computer:///mnt/user-data/outputs/XEM_Backend_API_Complete.md) - 백엔드 API 전체
3. [XEM_Docker_Setup.md](computer:///mnt/user-data/outputs/XEM_Docker_Setup.md) - Docker와 DB 설정
4. [XEM_Frontend_Pages_Part1.md](computer:///mnt/user-data/outputs/XEM_Frontend_Pages_Part1.md) - 프론트엔드 페이지 1-3

**남은 작업:**
- 페이지 4-9 (Analytics, Simulation, Users, Settings)
- App.tsx 라우터 설정
- 최종 통합 가이드

계속 진행할까요?
