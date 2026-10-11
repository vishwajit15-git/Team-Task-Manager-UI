import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api';
import { useAuth } from './auth';

type Project = {
  id: string;
  name: string;
  status: string;
  tasks?: any[];
  members?: any[];
};

type ProjectContextType = {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  isLoading: boolean;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const res = await apiFetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      return data.data.projects || [];
    },
    enabled: !!user  // only fetch when logged in
  });

  // Reset active project when user logs out
  useEffect(() => {
    if (!user) {
      setActiveProjectState(null);
    }
  }, [user]);

  // On first load / after login, restore from localStorage or default to first project
  useEffect(() => {
    if (user && projects.length > 0 && !activeProject) {
      const savedId = localStorage.getItem('activeProjectId');
      const saved = projects.find((p: Project) => p.id === savedId);
      setActiveProjectState(saved || projects[0]);
    }
  }, [user, projects, activeProject]);

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem('activeProjectId', project.id);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, activeProject, setActiveProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
