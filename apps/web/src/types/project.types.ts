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

export interface CreateProjectDto {
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
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}
