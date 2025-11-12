import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { executionApi, projectsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ExecutionPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch executions
  const { data, isLoading } = useQuery({
    queryKey: ['executions', statusFilter, projectFilter],
    queryFn: () =>
      executionApi.getAll({
        status: statusFilter === 'all' ? undefined : statusFilter,
        projectId: projectFilter === 'all' ? undefined : projectFilter,
      }),
  });

  // Fetch projects for filter
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  // Calculate statistics
  const stats = {
    total: data?.total || 0,
    draft: data?.executions?.filter((e: any) => e.status === 'DRAFT').length || 0,
    submitted:
      data?.executions?.filter((e: any) => e.status === 'SUBMITTED').length || 0,
    approved:
      data?.executions?.filter((e: any) => e.status === 'APPROVED').length || 0,
    rejected:
      data?.executions?.filter((e: any) => e.status === 'REJECTED').length || 0,
    thisMonthAmount:
      data?.executions
        ?.filter((e: any) => {
          const createdDate = new Date(e.createdAt);
          const now = new Date();
          return (
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum: number, e: any) => sum + e.amount, 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-600',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      DRAFT: '작성중',
      SUBMITTED: '승인대기',
      APPROVED: '승인완료',
      REJECTED: '반려',
      CANCELLED: '취소',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">집행 관리</h1>
          <p className="text-gray-500 mt-1">품의서 작성 및 집행 관리</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          신규 품의서 작성
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번달 집행</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.thisMonthAmount)}
              </p>
            </div>
            <div className="bg-primary bg-opacity-10 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">작성중</p>
              <p className="text-2xl font-bold text-gray-700 mt-2">{stats.draft}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인대기</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {stats.submitted}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">반려</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="품의번호 또는 프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">전체 상태</option>
            <option value="draft">작성중</option>
            <option value="submitted">승인대기</option>
            <option value="approved">승인완료</option>
            <option value="rejected">반려</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">전체 프로젝트</option>
            {projectsData?.projects?.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Execution List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품의번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  예산항목
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  요청일
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재단계
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-500 mt-2">데이터를 불러오는 중...</p>
                  </td>
                </tr>
              ) : data?.executions?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    집행 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                data?.executions?.map((execution: any) => (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {execution.executionNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {execution.creator?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {execution.budgetItem?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {execution.budgetItem?.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary">
                      {formatCurrency(execution.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(execution.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          execution.status
                        )}`}
                      >
                        {getStatusText(execution.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.currentStep || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button className="text-primary hover:text-primary-600 font-medium">
                        상세
                      </button>
                      {execution.status === 'DRAFT' && (
                        <button className="ml-3 text-blue-600 hover:text-blue-900 font-medium">
                          재작성
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
