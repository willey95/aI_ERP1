import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  exportToCSV,
  exportToExcel,
  formatProjectDataForExport,
  formatBudgetDataForExport,
  formatExecutionDataForExport,
  formatTransferDataForExport,
} from '@/lib/exportUtils';

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [reportType, setReportType] = useState<'projects' | 'budget' | 'executions' | 'transfers'>('projects');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch data based on report type
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report-data', reportType, selectedProject, dateFrom, dateTo],
    queryFn: async () => {
      switch (reportType) {
        case 'projects':
          const projectsResponse = await api.get('/projects');
          return projectsResponse.data.projects || [];

        case 'budget':
          if (!selectedProject) return [];
          const budgetResponse = await api.get(`/budget/project/${selectedProject}`);
          return budgetResponse.data || [];

        case 'executions':
          const executionsResponse = await api.get('/execution');
          return executionsResponse.data || [];

        case 'transfers':
          if (!selectedProject) return [];
          const transfersResponse = await api.get('/budget-transfer/history', {
            params: { projectId: selectedProject },
          });
          return transfersResponse.data || [];

        default:
          return [];
      }
    },
    enabled: reportType === 'projects' || reportType === 'executions' || !!selectedProject,
  });

  const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);

  const handleExportCSV = () => {
    let formattedData: any[] = [];
    let filename = '';

    switch (reportType) {
      case 'projects':
        formattedData = formatProjectDataForExport(reportData || []);
        filename = 'projects_report';
        break;
      case 'budget':
        formattedData = formatBudgetDataForExport(reportData || []);
        filename = `budget_report_${selectedProject}`;
        break;
      case 'executions':
        formattedData = formatExecutionDataForExport(reportData || []);
        filename = 'executions_report';
        break;
      case 'transfers':
        formattedData = formatTransferDataForExport(reportData || []);
        filename = `transfers_report_${selectedProject}`;
        break;
    }

    if (formattedData.length === 0) {
      alert('No data to export');
      return;
    }

    exportToCSV(formattedData, filename);
  };

  const handleExportExcel = () => {
    let formattedData: any[] = [];
    let filename = '';
    let sheetName = '';

    switch (reportType) {
      case 'projects':
        formattedData = formatProjectDataForExport(reportData || []);
        filename = 'projects_report';
        sheetName = 'Projects';
        break;
      case 'budget':
        formattedData = formatBudgetDataForExport(reportData || []);
        filename = `budget_report_${selectedProject}`;
        sheetName = 'Budget Items';
        break;
      case 'executions':
        formattedData = formatExecutionDataForExport(reportData || []);
        filename = 'executions_report';
        sheetName = 'Executions';
        break;
      case 'transfers':
        formattedData = formatTransferDataForExport(reportData || []);
        filename = `transfers_report_${selectedProject}`;
        sheetName = 'Transfers';
        break;
    }

    if (formattedData.length === 0) {
      alert('No data to export');
      return;
    }

    exportToExcel(formattedData, filename, sheetName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate and export reports for projects, budgets, executions, and transfers
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="projects">All Projects</option>
              <option value="budget">Budget Items</option>
              <option value="executions">Execution Requests</option>
              <option value="transfers">Budget Transfers</option>
            </select>
          </div>

          {/* Project Selection (for budget and transfers) */}
          {(reportType === 'budget' || reportType === 'transfers') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Project --</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Actions */}
          <div className="lg:col-span-2 flex items-end gap-2">
            <button
              onClick={handleExportCSV}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📑 Export Excel
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow" id="report-content">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {reportType === 'projects' && 'Projects Report'}
            {reportType === 'budget' && 'Budget Items Report'}
            {reportType === 'executions' && 'Execution Requests Report'}
            {reportType === 'transfers' && 'Budget Transfers Report'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Loading report data...</div>
            </div>
          ) : !reportData || reportData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for the selected criteria</p>
              {(reportType === 'budget' || reportType === 'transfers') && !selectedProject && (
                <p className="text-sm text-gray-400 mt-2">Please select a project</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Projects Report */}
              {reportType === 'projects' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Budget</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Executed</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Exec. Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((project: any) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(project.currentBudget)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(project.executedAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{project.executionRate.toFixed(2)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Budget Items Report */}
              {reportType === 'budget' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Main Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Item</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Executed</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Exec. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mainItem}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.subItem || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(item.currentBudget)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(item.executedAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(item.remainingBudget)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.executionRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Execution Requests Report */}
              {reportType === 'executions' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Item</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((exec: any) => (
                      <tr key={exec.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exec.requestNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exec.project?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exec.budgetItem?.mainItem || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(exec.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            exec.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            exec.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {exec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(exec.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Budget Transfers Report */}
              {reportType === 'transfers' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((transfer: any) => (
                      <tr key={transfer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(transfer.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transfer.sourceItem?.mainItem || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transfer.targetItem?.mainItem || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(transfer.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.transferType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            transfer.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transfer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {reportData && reportData.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total Records: <span className="font-semibold text-gray-900">{reportData.length}</span>
              </div>
              {reportType === 'projects' && (
                <div className="text-sm text-gray-600">
                  Total Budget: <span className="font-semibold text-gray-900">
                    {formatCurrency(reportData.reduce((sum: number, p: any) => sum + Number(p.currentBudget), 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
