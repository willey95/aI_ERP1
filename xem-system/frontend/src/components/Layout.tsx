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
        { path: '/cashflow', label: 'CF 테이블' },
      ],
    },
    { path: '/approvals', label: '승인' },
    { path: '/reports', label: '보고서' },
  ];

  return (
    <div className="min-h-screen bg-ink-0">
      {/* Sidebar - E-ink style */}
      <div className="fixed inset-y-0 left-0 w-72 bg-ink-9 border-r-2 border-ink-7 z-20">
        {/* Logo */}
        <div className="flex items-center h-20 px-8 border-b-2 border-ink-7 bg-ink-9">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight text-ink-0">
              XEM
            </h1>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-4 uppercase mt-0.5">
              예산집행관리
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-6 border-b-2 border-ink-7 bg-ink-9">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-ink-8 border-2 border-ink-6 flex items-center justify-center">
              <span className="text-sm font-bold text-ink-0">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink-0 truncate">{user?.name}</div>
              <div className="text-xs font-medium text-ink-4 truncate">{user?.role}</div>
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
                    className={`w-full group flex items-center justify-between px-4 py-3 text-sm font-bold tracking-wide transition-all duration-200 ${
                      anySubActive
                        ? 'bg-ink-7 text-ink-0 border-2 border-ink-5'
                        : 'text-ink-3 hover:text-ink-0 hover:bg-ink-8 border-2 border-transparent'
                    }`}
                  >
                    <span className="uppercase text-xs tracking-wider font-black">{item.label}</span>
                    <span className={`text-[10px] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isMenuOpen && (
                    <div className="ml-3 mt-1.5 space-y-0.5 pl-3 border-l-2 border-ink-7">
                      {item.subItems.map((subItem) => {
                        const isActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`block px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                              isActive
                                ? 'bg-ink-8 text-ink-0 border-l-2 border-ink-4 -ml-[14px] pl-[18px]'
                                : 'text-ink-4 hover:text-ink-0 hover:bg-ink-8'
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
                  className={`group flex items-center px-4 py-3 text-xs font-black tracking-wider transition-all duration-200 uppercase ${
                    isActive
                      ? 'bg-ink-7 text-ink-0 border-2 border-ink-5'
                      : 'text-ink-3 hover:text-ink-0 hover:bg-ink-8 border-2 border-transparent'
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-ink-7 bg-ink-9 z-10">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-xs font-black tracking-wider text-ink-3 hover:text-ink-0 bg-ink-8 hover:bg-ink-7 border-2 border-ink-7 hover:border-ink-5 transition-all duration-200 uppercase"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72">
        {/* Header - E-ink style */}
        <header className="sticky top-0 z-10 bg-ink-0 border-b-2 border-ink-3">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-ink-9">
                  {navItems.find((item) => item.path === location.pathname)?.label ||
                   navItems.find(item => 'subItems' in item && item.subItems.some(sub => sub.path === location.pathname))?.subItems.find(sub => sub.path === location.pathname)?.label ||
                   'XEM'}
                </h2>
                <p className="text-xs font-semibold text-ink-6 mt-0.5 tracking-wide">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1.5 bg-ink-2 border-2 border-ink-4">
                  <span className="text-xs font-bold text-ink-9 tracking-wide">{user?.role}</span>
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
