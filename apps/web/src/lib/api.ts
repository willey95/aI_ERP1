import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },
  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Projects API
export const projectsApi = {
  getAll: async (params?: any) => {
    const { data } = await api.get('/projects', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },
  create: async (projectData: any) => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },
  update: async (id: string, projectData: any) => {
    const { data } = await api.patch(`/projects/${id}`, projectData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },
};

// Budget API
export const budgetApi = {
  getByProject: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/budget`);
    return data;
  },
  getItems: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/budget/items`);
    return data;
  },
  createItem: async (projectId: string, itemData: any) => {
    const { data } = await api.post(`/projects/${projectId}/budget/items`, itemData);
    return data;
  },
  updateItem: async (projectId: string, itemId: string, itemData: any) => {
    const { data } = await api.patch(`/projects/${projectId}/budget/items/${itemId}`, itemData);
    return data;
  },
  deleteItem: async (projectId: string, itemId: string) => {
    const { data } = await api.delete(`/projects/${projectId}/budget/items/${itemId}`);
    return data;
  },
};

// Execution API
export const executionApi = {
  getAll: async (params?: any) => {
    const { data } = await api.get('/executions', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/executions/${id}`);
    return data;
  },
  create: async (executionData: any) => {
    const { data } = await api.post('/executions', executionData);
    return data;
  },
  update: async (id: string, executionData: any) => {
    const { data } = await api.patch(`/executions/${id}`, executionData);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/executions/${id}`);
    return data;
  },
  submit: async (id: string) => {
    const { data } = await api.post(`/executions/${id}/submit`);
    return data;
  },
};

// Approval API
export const approvalApi = {
  getPending: async () => {
    const { data } = await api.get('/approvals/pending');
    return data;
  },
  approve: async (executionId: string, comment?: string) => {
    const { data } = await api.post(`/approvals/${executionId}/approve`, { comment });
    return data;
  },
  reject: async (executionId: string, reason: string) => {
    const { data } = await api.post(`/approvals/${executionId}/reject`, { reason });
    return data;
  },
  getHistory: async (executionId: string) => {
    const { data } = await api.get(`/approvals/${executionId}/history`);
    return data;
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: async (projectId?: string) => {
    const { data } = await api.get('/analytics/dashboard', {
      params: { projectId },
    });
    return data;
  },
  getCashflow: async (projectId: string, params?: any) => {
    const { data } = await api.get(`/analytics/cashflow/${projectId}`, { params });
    return data;
  },
  getExecutionTrends: async (projectId: string, params?: any) => {
    const { data } = await api.get(`/analytics/execution-trends/${projectId}`, { params });
    return data;
  },
};

// Simulation API
export const simulationApi = {
  run: async (projectId: string, scenarios: any) => {
    const { data } = await api.post(`/simulation/${projectId}/run`, scenarios);
    return data;
  },
  getSaved: async (projectId: string) => {
    const { data } = await api.get(`/simulation/${projectId}/saved`);
    return data;
  },
  save: async (projectId: string, simulationData: any) => {
    const { data } = await api.post(`/simulation/${projectId}/save`, simulationData);
    return data;
  },
};

// File Upload API
export const uploadApi = {
  upload: async (file: File, category: string = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const { data } = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  uploadMultiple: async (files: File[], category: string = 'general') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);

    const { data } = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

export default api;
