import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const [projectMenuOpen, setProjectMenuOpen] = useState(true);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(true);
  const [executionMenuOpen, setExecutionMenuOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '대시보드' },
    {
      label: '프로젝트',
      subItems: [
        { path: '/projects', label: '목록' },
      ],
    },
    {
      label: '예산',
      subItems: [
        { path: '/budget', label: '개요' },
        { path: '/budget/manage', label: '항목' },
        { path: '/budget/transfers', label: '이체' },
      ],
    },
    {
      label: '집행',
      subItems: [
        { path: '/executions', label: '요청' },
        { path: '/executions/history', label: '히스토리 & CF' },
      ],
    },
    { path: '/approvals', label: '승인' },
    { path: '/reports', label: '보고서' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl border-r border-slate-800/50">
        {/* Logo */}
        <div className="flex items-center h-20 px-8 border-b border-slate-800/50">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight text-white">
              XEM
            </h1>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
              예산집행관리
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs font-medium text-slate-400 truncate">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {navItems.map((item, index) => {
            if ('subItems' in item) {
              // Menu with submenu
              const anySubActive = item.subItems.some(sub => location.pathname === sub.path);
              const isMenuOpen =
                item.label === '프로젝트' ? projectMenuOpen :
                item.label === '예산' ? budgetMenuOpen :
                executionMenuOpen;
              const toggleMenu =
                item.label === '프로젝트' ? () => setProjectMenuOpen(!projectMenuOpen) :
                item.label === '예산' ? () => setBudgetMenuOpen(!budgetMenuOpen) :
                () => setExecutionMenuOpen(!executionMenuOpen);

              return (
                <div key={index} className="space-y-1">
                  <button
                    onClick={toggleMenu}
                    className={`w-full group flex items-center justify-between px-4 py-3 text-sm font-bold tracking-wide rounded-lg transition-all duration-200 ${
                      anySubActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="uppercase text-xs tracking-wider font-black">{item.label}</span>
                    <span className={`text-[10px] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isMenuOpen && (
                    <div className="ml-3 mt-1.5 space-y-0.5 pl-3 border-l-2 border-slate-800">
                      {item.subItems.map((subItem) => {
                        const isActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`block px-4 py-2.5 text-xs font-semibold tracking-wide rounded-md transition-all duration-200 ${
                              isActive
                                ? 'bg-slate-800/80 text-blue-400 border-l-2 border-blue-400 -ml-[14px] pl-[18px]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular menu item
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`group flex items-center px-4 py-3 text-xs font-black tracking-wider rounded-lg transition-all duration-200 uppercase ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-xs font-black tracking-wider text-slate-300 hover:text-white bg-slate-800/50 hover:bg-red-900/30 border border-slate-700/50 hover:border-red-700/50 rounded-lg transition-all duration-200 uppercase"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72">
        {/* Header - Minimalist */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {navItems.find((item) => item.path === location.pathname)?.label ||
                   navItems.find(item => 'subItems' in item && item.subItems.some(sub => sub.path === location.pathname))?.subItems.find(sub => sub.path === location.pathname)?.label ||
                   'XEM'}
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 tracking-wide">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-full">
                  <span className="text-xs font-bold text-blue-700 tracking-wide">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
