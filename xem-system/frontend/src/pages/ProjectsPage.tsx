import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { Project } from '@/types';

// Tooltip Component
function ProjectTooltip({ project }: { project: Project }) {
  return (
    <div className="absolute z-50 p-4 bg-white border border-gray-300 rounded-lg shadow-xl min-w-[300px] pointer-events-none">
      <div className="space-y-2">
        <div>
          <span className="text-xs font-semibold text-gray-700">프로젝트:</span>
          <div className="text-sm font-bold text-gray-900">{project.name}</div>
          <div className="text-xs text-gray-500">{project.code}</div>
        </div>
        <div className="border-t border-gray-200 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">위치:</span>
              <div className="font-medium">{project.location}</div>
            </div>
            <div>
              <span className="text-gray-600">유형:</span>
              <div className="font-medium">{project.projectType}</div>
            </div>
            <div>
              <span className="text-gray-600">세대수:</span>
              <div className="font-medium">{project.units}</div>
            </div>
            <div>
              <span className="text-gray-600">총 예산:</span>
              <div className="font-medium">{formatCurrency(project.currentBudget)}</div>
            </div>
            <div>
              <span className="text-gray-600">집행률:</span>
              <div className="font-medium">{formatPercentage(project.executionRate)}</div>
            </div>
            <div>
              <span className="text-gray-600">상태:</span>
              <div className="font-medium">
                {project.status === 'ACTIVE' ? '진행중' :
                 project.status === 'PLANNING' ? '계획' :
                 project.status === 'COMPLETED' ? '완료' :
                 project.status === 'ON_HOLD' ? '보류' : project.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">프로젝트 로딩 중...</div>
      </div>
    );
  }

  const projects: Project[] = data || [];

  // Filter projects by status
  const filteredProjects = statusFilter === 'ALL'
    ? projects
    : projects.filter(p => p.status === statusFilter);

  // Get unique statuses for filter buttons
  const statuses = ['ALL', ...Array.from(new Set(projects.map(p => p.status)))];

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'ALL': return '전체';
      case 'ACTIVE': return '진행중';
      case 'PLANNING': return '계획';
      case 'COMPLETED': return '완료';
      case 'ON_HOLD': return '보류';
      default: return status;
    }
  };

  const handleMouseEnter = (project: Project, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 10,
      y: rect.top,
    });
    setHoveredProject(project);
  };

  const handleMouseLeave = () => {
    setHoveredProject(null);
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        <Link
          to="/projects/new"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          + 새 프로젝트
        </Link>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">프로젝트가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    위치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수주전
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    내부승인
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    착공단계
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 예산
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    집행액
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    잔액
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    집행률
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    세대수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/projects/${project.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500">{project.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.projectType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'PLANNING'
                            ? 'bg-blue-100 text-blue-800'
                            : project.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {project.status === 'ACTIVE' ? '진행중' :
                         project.status === 'PLANNING' ? '계획' :
                         project.status === 'COMPLETED' ? '완료' :
                         project.status === 'ON_HOLD' ? '보류' : project.status}
                      </span>
                    </td>
                    {/* 수주전 Phase */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {project.preContractDate ? (
                        <div
                          className="flex flex-col items-center gap-1 cursor-help"
                          onMouseEnter={(e) => handleMouseEnter(project, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <span className="text-xs text-gray-600">
                            {new Date(project.preContractDate).toLocaleDateString('ko-KR')}
                          </span>
                          {project.currentPhase === 'PRE_CONTRACT' && (
                            <span className="text-xs font-semibold text-blue-600">진행중</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    {/* 내부승인 Phase */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {project.internalApprovalDate ? (
                        <div
                          className="flex flex-col items-center gap-1 cursor-help"
                          onMouseEnter={(e) => handleMouseEnter(project, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <span className="text-xs text-gray-600">
                            {new Date(project.internalApprovalDate).toLocaleDateString('ko-KR')}
                          </span>
                          {project.currentPhase === 'INTERNAL_APPROVAL' && (
                            <span className="text-xs font-semibold text-blue-600">진행중</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    {/* 착공단계 Phase */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {project.constructionStartDate ? (
                        <div
                          className="flex flex-col items-center gap-1 cursor-help"
                          onMouseEnter={(e) => handleMouseEnter(project, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <span className="text-xs text-gray-600">
                            {new Date(project.constructionStartDate).toLocaleDateString('ko-KR')}
                          </span>
                          {project.currentPhase === 'CONSTRUCTION' && (
                            <span className="text-xs font-semibold text-blue-600">진행중</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.currentBudget)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-blue-600 font-medium">
                        {formatCurrency(project.executedAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-green-600 font-medium">
                        {formatCurrency(project.remainingBudget)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPercentage(project.executionRate)}
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              project.executionRate >= 80
                                ? 'bg-green-600'
                                : project.executionRate >= 50
                                ? 'bg-blue-600'
                                : 'bg-yellow-600'
                            }`}
                            style={{ width: `${Math.min(project.executionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{project.units}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredProject && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <ProjectTooltip project={hoveredProject} />
        </div>
      )}
    </div>
  );
}
