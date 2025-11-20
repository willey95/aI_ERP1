import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectStoreState {
  selectedProjectId: string;
  setSelectedProjectId: (projectId: string) => void;
  clearSelection: () => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      selectedProjectId: '',
      setSelectedProjectId: (projectId: string) => set({ selectedProjectId: projectId }),
      clearSelection: () => set({ selectedProjectId: '' }),
    }),
    {
      name: 'project-storage', // localStorage key
    }
  )
);
