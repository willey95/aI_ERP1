import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  const projects: Project[] = data?.projects || [];

  // Filter projects by status
  const filteredProjects = statusFilter === 'ALL'
    ? projects
    : projects.filter(p => p.status === statusFilter);

  // Get unique statuses for filter buttons
  const statuses = ['ALL', ...Array.from(new Set(projects.map(p => p.status)))];

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
              {status}
            </button>
          ))}
        </div>

        <Link
          to="/projects/new"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.code}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'PLANNING'
                        ? 'bg-blue-100 text-blue-800'
                        : project.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Location and Type */}
                <div className="mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <span>📍</span>
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🏗️</span>
                    <span>{project.projectType}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Total Budget</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(project.currentBudget)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Executed</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(project.executedAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Remaining</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(project.remainingBudget)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Execution Rate</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercentage(project.executionRate)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{formatPercentage(project.executionRate)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
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

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">ROI:</span> {formatPercentage(project.roi)}
                    </div>
                    <div>
                      <span className="font-medium">Risk:</span> {project.riskScore}/100
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {project.units} units
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
