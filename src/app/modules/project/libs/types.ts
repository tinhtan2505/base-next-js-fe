export type ProjectStatus = "planning" | "active" | "paused" | "done";

export type Project = {
  id: string;
  code: string;
  name: string;
  owner: string;
  status: ProjectStatus;
  startDate: string; // ISO
  dueDate?: string; // ISO
  budget?: number;
  progress?: number; // 0-100
  tags?: string[];
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type CustomResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ProjectCreateRequest = {
  code: string;
  name: string;
  owner: string;
  status: ProjectStatus;
  startDate: string;
  dueDate?: string;
  budget?: number;
  progress?: number;
  tags?: string[];
  description?: string;
};
