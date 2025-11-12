import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project } from '@/types';

interface ProjectStore {
  selectedProject: Project | null;
  projects: Project[];
  setSelectedProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  devtools((set) => ({
    selectedProject: null,
    projects: [],

    setSelectedProject: (project: Project | null) => {
      set({ selectedProject: project });
    },

    setProjects: (projects: Project[]) => {
      set({ projects });
    },

    addProject: (project: Project) => {
      set((state) => ({
        projects: [...state.projects, project],
      }));
    },

    updateProject: (projectId: string, updates: Partial<Project>) => {
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, ...updates } : p
        ),
        selectedProject:
          state.selectedProject?.id === projectId
            ? { ...state.selectedProject, ...updates }
            : state.selectedProject,
      }));
    },

    removeProject: (projectId: string) => {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        selectedProject:
          state.selectedProject?.id === projectId
            ? null
            : state.selectedProject,
      }));
    },
  }))
);
