# XEM System - Claude Code Implementation Prompt
## Complete Development Guide for AI-Assisted Coding

---

## 🎯 Project Overview

You are building **XEM (eXecution & Expenditure Management)**, an enterprise budget management platform for construction/real estate companies. This system manages multi-billion dollar projects with complex approval workflows, real-time monitoring, and AI-powered analytics.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- State: Zustand + TanStack Query
- Forms: React Hook Form + Zod
- Charts: Recharts
- Tables: TanStack Table v8
- Backend: NestJS + PostgreSQL + Prisma + Redis
- AI: Anthropic Claude API

---

## 📁 Project Structure

```
xem-system/
├── apps/
│   ├── web/                          # Frontend application
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/                  # Next.js app router (or React Router)
│   │   │   ├── components/           # Reusable components
│   │   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   │   ├── layouts/         # Page layouts
│   │   │   │   ├── projects/        # Project-specific components
│   │   │   │   ├── budget/          # Budget management components
│   │   │   │   ├── execution/       # Execution workflow components
│   │   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   │   └── simulation/      # Simulation components
│   │   │   ├── features/            # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── budget/
│   │   │   │   ├── execution/
│   │   │   │   ├── cashflow/
│   │   │   │   ├── simulation/
│   │   │   │   └── analytics/
│   │   │   ├── lib/                 # Utilities & helpers
│   │   │   │   ├── api.ts
│   │   │   │   ├── utils.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── validations.ts
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── stores/              # Zustand stores
│   │   │   ├── types/               # TypeScript types
│   │   │   ├── styles/              # Global styles
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   └── api/                          # Backend application
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── projects/
│       │   │   ├── budget/
│       │   │   ├── execution/
│       │   │   ├── cashflow/
│       │   │   ├── simulation/
│       │   │   ├── analytics/
│       │   │   └── notifications/
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   ├── database/
│       │   │   ├── migrations/
│       │   │   └── seeds/
│       │   ├── config/
│       │   └── main.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                         # Shared packages
│   ├── types/                       # Shared TypeScript types
│   ├── utils/                       # Shared utilities
│   └── config/                      # Shared configurations
│
├── docker-compose.yml
├── package.json                      # Root workspace config
└── README.md
```

---

## 🚀 Phase 1: Initial Setup & Core Infrastructure

### Step 1: Project Initialization

```bash
# Create monorepo structure
mkdir xem-system && cd xem-system
npm init -y

# Create workspace structure
mkdir -p apps/web apps/api packages/types packages/utils

# Initialize frontend
cd apps/web
npm create vite@latest . -- --template react-ts

# Install core dependencies
npm install react-router-dom zustand @tanstack/react-query
npm install @hookform/resolvers react-hook-form zod
npm install recharts @tanstack/react-table
npm install date-fns clsx tailwind-merge
npm install lucide-react

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p

# Initialize shadcn/ui
npx shadcn-ui@latest init
```

### Step 2: Configure shadcn/ui Components

```bash
# Add essential components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

### Step 3: Tailwind Configuration

```typescript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        // Add custom execution rate colors
        execution: {
          low: "#10B981",      // 0-50%: Green
          medium: "#F59E0B",   // 50-75%: Yellow
          high: "#FB923C",     // 75-90%: Orange
          critical: "#EF4444", // 90-100%: Red
          over: "#991B1B",     // >100%: Dark Red
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 🏗️ Phase 2: Core Feature Implementation

### Feature 1: Project List & Dashboard

**File: `src/types/project.types.ts`**
```typescript
export type ProjectType = 'self' | 'spc' | 'joint' | 'cooperative';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'suspended';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  location: string;
  scale: {
    totalArea: number;
    units: number;
    floors: number;
  };
  targetROI: number;
  budget: {
    totalRevenue: number;
    totalExpense: number;
    executed: number;
    remaining: number;
    executionRate: number;
  };
  riskScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
}
```

**File: `src/components/projects/ProjectCard.tsx`**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { Project } from '@/types/project.types';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getRiskBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-danger text-danger-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const getExecutionRateColor = (rate: number) => {
    if (rate >= 90) return 'execution-over';
    if (rate >= 75) return 'execution-critical';
    if (rate >= 50) return 'execution-high';
    return 'execution-low';
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(project)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">
          {project.name}
        </CardTitle>
        <Badge className={getRiskBadgeColor(project.riskScore)}>
          Risk: {project.riskScore}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">위치</span>
          <span className="font-medium">{project.location}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">총 예산</span>
            <span className="font-bold text-lg">
              {formatCurrency(project.budget.totalRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">집행액</span>
            <span className="font-medium text-primary">
              {formatCurrency(project.budget.executed)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">잔액</span>
            <span className="font-medium">
              {formatCurrency(project.budget.remaining)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">집행률</span>
            <span className={`font-bold text-${getExecutionRateColor(project.budget.executionRate)}`}>
              {formatPercentage(project.budget.executionRate)}
            </span>
          </div>
          <Progress 
            value={project.budget.executionRate} 
            className={`h-2 bg-${getExecutionRateColor(project.budget.executionRate)}`}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>목표 ROI: {formatPercentage(project.targetROI)}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Building2 className="w-4 h-4 mr-1" />
            <span>{project.scale.units}세대</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**File: `src/pages/ProjectListPage.tsx`**
```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectDashboardModal } from '@/components/projects/ProjectDashboardModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { Project } from '@/types/project.types';
import { fetchProjects } from '@/lib/api';

export function ProjectListPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', searchQuery, statusFilter],
    queryFn: () => fetchProjects({ search: searchQuery, status: statusFilter }),
  });

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-1">
            사업비 집행 현황을 한눈에 확인하세요
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          신규 프로젝트
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="프로젝트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <option value="all">전체 상태</option>
          <option value="planning">계획</option>
          <option value="active">진행중</option>
          <option value="completed">완료</option>
          <option value="suspended">중단</option>
        </Select>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
            />
          ))}
        </div>
      )}

      {/* Dashboard Modal */}
      {selectedProject && (
        <ProjectDashboardModal
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
```

### Feature 2: Project Dashboard Modal

**File: `src/components/projects/ProjectDashboardModal.tsx`**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Download,
  Settings
} from 'lucide-react';
import { Project } from '@/types/project.types';
import { BudgetOverview } from './dashboard/BudgetOverview';
import { CashFlowChart } from './dashboard/CashFlowChart';
import { ExecutionTable } from './dashboard/ExecutionTable';
import { SimulationPanel } from './dashboard/SimulationPanel';

interface ProjectDashboardModalProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export function ProjectDashboardModal({ 
  project, 
  open, 
  onClose 
}: ProjectDashboardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {project.name} - 사업비 관리 현황
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                엑셀 다운로드
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* KPI Summary */}
        <div className="grid grid-cols-4 gap-4 py-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">총 예산</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">
              ₩{(project.budget.totalRevenue / 100000000).toFixed(0)}억
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">집행액</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold mt-2">
              ₩{(project.budget.executed / 100000000).toFixed(0)}억
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {project.budget.executionRate.toFixed(1)}% 집행
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">잔액</span>
              <FileText className="w-4 h-4 text-warning" />
            </div>
            <p className="text-2xl font-bold mt-2">
              ₩{(project.budget.remaining / 100000000).toFixed(0)}억
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">리스크 스코어</span>
              <Activity className="w-4 h-4 text-danger" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {project.riskScore}/100
            </p>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">사업수지</TabsTrigger>
            <TabsTrigger value="cashflow">현금흐름</TabsTrigger>
            <TabsTrigger value="execution">집행실적</TabsTrigger>
            <TabsTrigger value="simulation">시뮬레이션</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-auto">
            <BudgetOverview projectId={project.id} />
          </TabsContent>

          <TabsContent value="cashflow" className="flex-1 overflow-auto">
            <CashFlowChart projectId={project.id} />
          </TabsContent>

          <TabsContent value="execution" className="flex-1 overflow-auto">
            <ExecutionTable projectId={project.id} />
          </TabsContent>

          <TabsContent value="simulation" className="flex-1 overflow-auto">
            <SimulationPanel projectId={project.id} />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button>
            품의서 작성
          </Button>
          <Button variant="secondary">
            예산 변경
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Feature 3: Budget Overview (Waterfall Chart)

**File: `src/components/projects/dashboard/BudgetOverview.tsx`**
```typescript
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchBudgetData } from '@/lib/api';

interface BudgetOverviewProps {
  projectId: string;
}

export function BudgetOverview({ projectId }: BudgetOverviewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget', projectId],
    queryFn: () => fetchBudgetData(projectId),
  });

  if (isLoading) return <div>Loading...</div>;

  // Prepare waterfall chart data
  const waterfallData = [
    { name: '분양수입', value: data.revenue.presale, fill: '#10B981' },
    { name: '임대수입', value: data.revenue.rental, fill: '#10B981' },
    { name: '총수입', value: data.revenue.total, fill: '#2563EB' },
    { name: '토지비', value: -data.expense.land, fill: '#EF4444' },
    { name: '공사비', value: -data.expense.construction, fill: '#EF4444' },
    { name: '설계/감리', value: -data.expense.design, fill: '#EF4444' },
    { name: '부담금', value: -data.expense.contributions, fill: '#F59E0B' },
    { name: '금융비용', value: -data.expense.finance, fill: '#F59E0B' },
    { name: '마케팅', value: -data.expense.marketing, fill: '#F59E0B' },
    { name: '사업이익', value: data.profit, fill: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Waterfall Chart */}
      <Card>
        <CardHeader>
          <CardTitle>사업수지 구성 (Waterfall Chart)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis 
                tickFormatter={(value) => `₩${(value / 100000000).toFixed(0)}억`}
              />
              <Tooltip
                formatter={(value: number) => `₩${(value / 100000000).toFixed(2)}억`}
              />
              <Bar dataKey="value">
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>항목별 상세 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>구분</TableHead>
                <TableHead>항목</TableHead>
                <TableHead className="text-right">최초 예산</TableHead>
                <TableHead className="text-right">변경 예산</TableHead>
                <TableHead className="text-right">집행액</TableHead>
                <TableHead className="text-right">잔액</TableHead>
                <TableHead className="text-right">집행률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">
                    ₩{(item.initialAmount / 100000000).toFixed(2)}억
                  </TableCell>
                  <TableCell className="text-right">
                    ₩{(item.currentAmount / 100000000).toFixed(2)}억
                  </TableCell>
                  <TableCell className="text-right text-primary font-semibold">
                    ₩{(item.executedAmount / 100000000).toFixed(2)}억
                  </TableCell>
                  <TableCell className="text-right">
                    ₩{(item.remainingAmount / 100000000).toFixed(2)}억
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={getExecutionRateClass(item.executionRate)}>
                      {item.executionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function getExecutionRateClass(rate: number): string {
  if (rate >= 100) return 'text-execution-over font-bold';
  if (rate >= 90) return 'text-execution-critical font-bold';
  if (rate >= 75) return 'text-execution-high font-semibold';
  if (rate >= 50) return 'text-execution-medium';
  return 'text-execution-low';
}
```

---

## 📊 Key Implementation Guidelines

### 1. Component Structure
- **Atomic Design**: Build from atoms (Button) → molecules (FormField) → organisms (ExecutionForm) → pages
- **Composition over Inheritance**: Use composition patterns
- **Single Responsibility**: Each component does one thing well

### 2. State Management with Zustand

```typescript
// src/stores/projectStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ProjectState {
  selectedProject: Project | null;
  projects: Project[];
  setSelectedProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set) => ({
        selectedProject: null,
        projects: [],
        setSelectedProject: (project) => set({ selectedProject: project }),
        setProjects: (projects) => set({ projects }),
      }),
      {
        name: 'project-storage',
      }
    )
  )
);
```

### 3. API Client with TanStack Query

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const fetchProjects = async (params: any) => {
  const { data } = await api.get('/projects', { params });
  return data;
};

export const fetchBudgetData = async (projectId: string) => {
  const { data } = await api.get(`/projects/${projectId}/budget`);
  return data;
};
```

### 4. Form Handling with React Hook Form + Zod

```typescript
// src/components/execution/ExecutionRequestForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const executionSchema = z.object({
  budgetItemId: z.string().min(1, '예산 항목을 선택해주세요'),
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  requestDate: z.date(),
  justification: z.string().min(10, '사유를 최소 10자 이상 입력해주세요'),
  attachments: z.array(z.instanceof(File)).optional(),
});

type ExecutionFormData = z.infer<typeof executionSchema>;

export function ExecutionRequestForm() {
  const form = useForm<ExecutionFormData>({
    resolver: zodResolver(executionSchema),
    defaultValues: {
      amount: 0,
      requestDate: new Date(),
      justification: '',
    },
  });

  const onSubmit = async (data: ExecutionFormData) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### 5. Responsive Design Breakpoints

```typescript
// src/lib/constants.ts
export const BREAKPOINTS = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1920px',
} as const;

// Usage in Tailwind: sm: md: lg: xl: 2xl:
```

---

## 🎨 Design System Rules

### Color Usage
- **Primary (#2563EB)**: Main actions, links, brand elements
- **Success (#10B981)**: Positive actions, 0-50% execution rate
- **Warning (#F59E0B)**: Cautions, 50-75% execution rate
- **Danger (#EF4444)**: Errors, destructive actions, >90% execution
- **Neutral**: Text, borders, backgrounds

### Typography
- **H1**: 30px (text-3xl), Semi-bold
- **H2**: 24px (text-2xl), Semi-bold
- **H3**: 20px (text-xl), Semi-bold
- **Body**: 16px (text-base), Regular
- **Small**: 14px (text-sm), Regular
- **Tiny**: 12px (text-xs), Regular

### Spacing
- Use Tailwind's spacing scale: space-y-4, gap-6, p-8, etc.
- Consistent padding: Cards (p-6), Modals (p-8), Buttons (px-4 py-2)

### Interactive States
- **Hover**: Subtle color darkening, shadow increase
- **Active**: Color darkening, scale down
- **Focus**: Ring outline (ring-2 ring-primary)
- **Disabled**: Opacity 50%, cursor-not-allowed

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage } from './utils';

describe('formatCurrency', () => {
  it('formats Korean won correctly', () => {
    expect(formatCurrency(5000000000)).toBe('₩50억');
  });
});
```

### Component Tests (React Testing Library)
```typescript
// src/components/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

describe('ProjectCard', () => {
  it('renders project information', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      // ... other fields
    };

    render(<ProjectCard project={project} onClick={vi.fn()} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });
});
```

---

## 🚀 Performance Optimization

1. **Code Splitting**: Use React.lazy() for route-based splitting
2. **Memoization**: Use React.memo, useMemo, useCallback wisely
3. **Virtual Scrolling**: Use @tanstack/react-virtual for large lists
4. **Image Optimization**: Use WebP format, lazy loading
5. **Bundle Analysis**: Regularly check with vite-bundle-visualizer

---

## 🔒 Security Considerations

1. **Input Validation**: Always validate on both client and server
2. **XSS Prevention**: Sanitize user input, use DOMPurify
3. **CSRF Protection**: Use tokens for state-changing operations
4. **Auth Tokens**: Store in httpOnly cookies or secure localStorage
5. **Rate Limiting**: Implement on API endpoints

---

## 📦 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build successful (npm run build)
- [ ] No console errors in production build
- [ ] Lighthouse score > 90
- [ ] All tests passing
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Monitoring/logging configured

---

## 🤖 AI Development Tips

When using Claude Code, structure your prompts like this:

```
"Create a BudgetItemSelector component that:
1. Fetches budget items from API using TanStack Query
2. Displays in a searchable dropdown using shadcn/ui Command
3. Shows current balance and execution rate for each item
4. Validates selection with Zod
5. Follows the design system color scheme
6. Includes loading and error states
7. Is fully typed with TypeScript"
```

**Best Practices:**
- Be specific about tech stack components to use
- Request TypeScript types
- Ask for error handling
- Specify styling requirements
- Request responsive design
- Include accessibility features

---

## 📚 Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [React Hook Form Guide](https://react-hook-form.com/get-started)
- [Zod Schema Validation](https://zod.dev)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Maintained By**: Development Team
