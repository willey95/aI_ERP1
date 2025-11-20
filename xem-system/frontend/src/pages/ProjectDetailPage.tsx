import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error || 'Project not found'}</div>
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">Code: {project.code}</p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Budget</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(project.currentBudget)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Executed</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(project.executedAmount)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Remaining</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(project.remainingBudget)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">재무 분석 도구</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate(`/simulation/${id}`)}
            className="p-4 border-2 border-stone-200 rounded-lg hover:border-stone-900 hover:bg-stone-50 transition-all group"
          >
            <div className="font-semibold text-gray-900">시나리오 분석</div>
            <div className="text-xs text-gray-500 mt-1">다양한 변수로 예측</div>
          </button>

          <button
            onClick={() => navigate(`/financial/${id}`)}
            className="p-4 border-2 border-stone-200 rounded-lg hover:border-stone-900 hover:bg-stone-50 transition-all group"
          >
            <div className="font-semibold text-gray-900">재무 모델</div>
            <div className="text-xs text-gray-500 mt-1">36개월 재무 전망</div>
          </button>

          <button
            onClick={() => navigate(`/cashflow/${id}`)}
            className="p-4 border-2 border-stone-200 rounded-lg hover:border-stone-900 hover:bg-stone-50 transition-all group"
          >
            <div className="font-semibold text-gray-900">현금 흐름</div>
            <div className="text-xs text-gray-500 mt-1">유입/유출 관리</div>
          </button>

          <button
            onClick={() => navigate(`/calculator/${id}`)}
            className="p-4 border-2 border-stone-200 rounded-lg hover:border-stone-900 hover:bg-stone-50 transition-all group"
          >
            <div className="font-semibold text-gray-900">예산 계산기</div>
            <div className="text-xs text-gray-500 mt-1">수식 기반 계산</div>
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Project Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1 text-gray-900">{project.status}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Type</h3>
            <p className="mt-1 text-gray-900">{project.projectType}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="mt-1 text-gray-900">{project.location}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Execution Rate</h3>
            <p className="mt-1 text-gray-900">{project.executionRate.toFixed(2)}%</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Land Area</h3>
            <p className="mt-1 text-gray-900">{project.landArea.toLocaleString()} m²</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Building Area</h3>
            <p className="mt-1 text-gray-900">{project.buildingArea.toLocaleString()} m²</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Floor Area</h3>
            <p className="mt-1 text-gray-900">{project.totalFloorArea.toLocaleString()} m²</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Units</h3>
            <p className="mt-1 text-gray-900">{project.units}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
            <p className="mt-1 text-gray-900">{formatDate(project.startDate)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Completion Date</h3>
            <p className="mt-1 text-gray-900">{formatDate(project.completionDate)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Expected Profit</h3>
            <p className="mt-1 text-gray-900">{formatCurrency(project.expectedProfit)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">ROI</h3>
            <p className="mt-1 text-gray-900">{project.roi.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
