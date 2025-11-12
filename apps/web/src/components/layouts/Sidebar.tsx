import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Calculator,
  FileText,
  CheckSquare,
  BarChart3,
  Beaker,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: '대시보드', to: '/dashboard', icon: LayoutDashboard },
  { name: '프로젝트 관리', to: '/projects', icon: FolderKanban },
  { name: '예산 관리', to: '/budget', icon: Calculator },
  { name: '집행 관리', to: '/execution', icon: FileText },
  { name: '결재', to: '/approval', icon: CheckSquare },
  { name: '분석 리포트', to: '/analytics', icon: BarChart3 },
  { name: '시뮬레이션', to: '/simulation', icon: Beaker },
  { name: '시스템 설정', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary">XEM</h1>
        <span className="ml-2 text-sm text-gray-500">v1.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2024 XEM System
        </div>
      </div>
    </div>
  );
}
