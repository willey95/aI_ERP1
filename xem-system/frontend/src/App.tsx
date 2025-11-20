import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectNewPage from './pages/ProjectNewPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import BudgetPage from './pages/BudgetPage';
import BudgetManagementPage from './pages/BudgetManagementPage';
import BudgetTransferPage from './pages/BudgetTransferPage';
import ExecutionsPage from './pages/ExecutionsPage';
import ExecutionRequestCreatePage from './pages/ExecutionRequestCreatePage';
import ExecutionHistoryPage from './pages/ExecutionHistoryPage';
import ExecutionDetailPage from './pages/ExecutionDetailPage';
import ApprovalsPage from './pages/ApprovalsPage';
import ApproverDashboardPage from './pages/ApproverDashboardPage';
import ReportsPage from './pages/ReportsPage';
import SimulationPage from './pages/SimulationPage';
import FinancialModelPage from './pages/FinancialModelPage';
import CashFlowPage from './pages/CashFlowPage';
import BudgetCalculatorPage from './pages/BudgetCalculatorPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AuthUnauthorizedHandler() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate]);

  return null;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <AuthUnauthorizedHandler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <ProjectNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <BudgetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget/manage"
          element={
            <ProtectedRoute>
              <BudgetManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget/transfers"
          element={
            <ProtectedRoute>
              <BudgetTransferPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executions"
          element={
            <ProtectedRoute>
              <ExecutionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executions/new"
          element={
            <ProtectedRoute>
              <ExecutionRequestCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executions/history"
          element={
            <ProtectedRoute>
              <ExecutionHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executions/:id"
          element={
            <ProtectedRoute>
              <ExecutionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals/review/:executionRequestId"
          element={
            <ProtectedRoute>
              <ApproverDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:projectId"
          element={
            <ProtectedRoute>
              <SimulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial/:projectId"
          element={
            <ProtectedRoute>
              <FinancialModelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashflow"
          element={
            <ProtectedRoute>
              <CashFlowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashflow/:projectId"
          element={
            <ProtectedRoute>
              <CashFlowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculator/:projectId"
          element={
            <ProtectedRoute>
              <BudgetCalculatorPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
