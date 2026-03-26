import { api } from './api'

export interface Project {
  id: string
  name: string
}

export interface ProjectsResponse {
  data: Project[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const projectsService = {
  getAll: (page = 1, limit = 10) =>
    api.get<ProjectsResponse>(`/projects?page=${page}&limit=${limit}`),
}
