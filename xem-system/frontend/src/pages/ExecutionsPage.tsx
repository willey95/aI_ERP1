import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ExecutionRequest, Project, BudgetItem } from '@/types';

export default function ExecutionsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch execution requests
  const { data, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: async () => {
      const response = await api.get('/execution');
      return response.data;
    },
  });

  const executions: ExecutionRequest[] = data?.executions || [];

  // Filter executions by status
  const filteredExecutions = statusFilter === 'ALL'
    ? executions
    : executions.filter(e => e.status === statusFilter);

  // Get unique statuses for filter buttons
  const statuses = ['ALL', ...Array.from(new Set(executions.map(e => e.status)))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading execution requests...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar */}
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

        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          + New Request
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateExecutionForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ['executions'] });
          }}
        />
      )}

      {/* Executions List */}
      {filteredExecutions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No execution requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Execution Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExecutions.map((execution: any) => (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {execution.requestNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execution.project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.budgetItem?.mainItem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(execution.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(execution.executionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        execution.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        execution.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        execution.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Step {execution.currentStep}/4
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(execution.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Execution Request Form Component
function CreateExecutionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState('');
  const [amount, setAmount] = useState('');
  const [executionDate, setExecutionDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch budget items for selected project
  const { data: budgetData } = useQuery({
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/execution', data);
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        projectId: selectedProjectId,
        budgetItemId: selectedBudgetItemId,
        amount: parseFloat(amount),
        executionDate,
        purpose,
        description,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create execution request');
    }
  };

  const selectedBudgetItem = budgetItems.find(b => b.id === selectedBudgetItemId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Execution Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedBudgetItemId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Item *
            </label>
            <select
              required
              value={selectedBudgetItemId}
              onChange={(e) => setSelectedBudgetItemId(e.target.value)}
              disabled={!selectedProjectId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Select Budget Item --</option>
              {budgetItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.mainItem} {item.subItem ? `- ${item.subItem}` : ''} (Available: {formatCurrency(item.remainingBudget)})
                </option>
              ))}
            </select>
          </div>

          {/* Budget Info */}
          {selectedBudgetItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Budget:</span>
                  <div className="font-semibold">{formatCurrency(selectedBudgetItem.currentBudget)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Executed:</span>
                  <div className="font-semibold">{formatCurrency(selectedBudgetItem.executedAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Remaining:</span>
                  <div className="font-semibold text-green-600">{formatCurrency(selectedBudgetItem.remainingBudget)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Execution Rate:</span>
                  <div className="font-semibold">{selectedBudgetItem.executionRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (KRW) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>

          {/* Execution Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Execution Date *
            </label>
            <input
              type="date"
              required
              value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose *
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief purpose of this execution"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
