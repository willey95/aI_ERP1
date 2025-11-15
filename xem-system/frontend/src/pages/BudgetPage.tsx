import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { Project, BudgetItem } from '@/types';

export default function BudgetPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Fetch all projects for the dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch budget items for the selected project
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response = await api.get(`/budget/project/${selectedProjectId}`);
      return response.data;
    },
    enabled: !!selectedProjectId,
  });

  const projects: Project[] = projectsData?.projects || [];
  const budgetItems: BudgetItem[] = budgetData?.items || [];
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Group budget items by category
  const groupedItems = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  return (
    <div>
      {/* Project Selector */}
      <div className="mb-6">
        <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProjectId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Please select a project to view budget details</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading budget data...</div>
        </div>
      ) : (
        <>
          {/* Project Summary Card */}
          {selectedProject && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Total Budget</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedProject.currentBudget)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Executed</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedProject.executedAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Remaining</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedProject.remainingBudget)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Execution Rate</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPercentage(selectedProject.executionRate)}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(selectedProject.executionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Items by Category */}
          {Object.keys(groupedItems).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No budget items found for this project</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => {
                // Calculate category totals
                const categoryTotal = items.reduce(
                  (sum, item) => ({
                    budget: sum.budget + parseFloat(item.currentBudget),
                    executed: sum.executed + parseFloat(item.executedAmount),
                    remaining: sum.remaining + parseFloat(item.remainingBudget),
                  }),
                  { budget: 0, executed: 0, remaining: 0 }
                );
                const categoryRate = categoryTotal.budget === 0
                  ? 0
                  : (categoryTotal.executed / categoryTotal.budget) * 100;

                return (
                  <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-500">Budget: </span>
                            <span className="font-semibold">{formatCurrency(categoryTotal.budget)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Executed: </span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(categoryTotal.executed)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rate: </span>
                            <span className="font-semibold">{formatPercentage(categoryRate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget Items Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Budget
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Executed
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remaining
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Progress
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.mainItem}
                                </div>
                                {item.subItem && (
                                  <div className="text-xs text-gray-500">{item.subItem}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {formatCurrency(item.currentBudget)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                                {formatCurrency(item.executedAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                                {formatCurrency(item.remainingBudget)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                {formatPercentage(item.executionRate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      item.executionRate >= 90
                                        ? 'bg-red-600'
                                        : item.executionRate >= 70
                                        ? 'bg-yellow-600'
                                        : 'bg-green-600'
                                    }`}
                                    style={{ width: `${Math.min(item.executionRate, 100)}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
