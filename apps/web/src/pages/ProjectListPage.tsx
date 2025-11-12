import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { Plus, Search } from 'lucide-react';
import { Project } from '@/types';
import {
  formatCurrency,
  formatPercentage,
  getExecutionRateBadgeClass,
  getRiskBadgeColor,
} from '@/lib/utils';

export default function ProjectListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', searchQuery, statusFilter],
    queryFn: () =>
      projectsApi.getAll({
        search: searchQuery,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="text-gray-500 mt-1">
            사업비 집행 현황을 한눈에 확인하세요
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          신규 프로젝트
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="프로젝트 검색..."
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
          <option value="planning">계획</option>
          <option value="active">진행중</option>
          <option value="completed">완료</option>
          <option value="suspended">중단</option>
        </select>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.projects?.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          )) || (
            <div className="col-span-full text-center py-12 text-gray-500">
              프로젝트가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow cursor-pointer">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {project.name}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(
              project.riskScore
            )}`}
          >
            Risk: {project.riskScore}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">위치</span>
            <span className="font-medium text-gray-900">{project.location}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">총 예산</span>
            <span className="font-bold text-lg text-gray-900">
              {formatCurrency(project.budget.totalRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">집행액</span>
            <span className="font-medium text-primary">
              {formatCurrency(project.budget.executed)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">잔액</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(project.budget.remaining)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">집행률</span>
            <span
              className={`font-bold ${getExecutionRateBadgeClass(
                project.budget.executionRate
              )}`}
            >
              {formatPercentage(project.budget.executionRate)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getExecutionRateBadgeClass(
                project.budget.executionRate
              )}`}
              style={{ width: `${Math.min(project.budget.executionRate, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <span>ROI: {formatPercentage(project.targetROI)}</span>
          <span>{project.scale.units}세대</span>
        </div>
      </div>
    </div>
  );
}
