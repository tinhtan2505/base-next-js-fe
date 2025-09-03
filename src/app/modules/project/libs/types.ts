// Status code map với BE: 0=Planning, 1=Active, 2=Paused, 3=Done
export enum ProjectStatusEnum {
  PLANNING = 0,
  ACTIVE = 1,
  PAUSED = 2,
  DONE = 3,
}

export type ProjectStatus = ProjectStatusEnum;

export type Project = {
  id: string;
  code: string;
  name: string;
  owner: string;
  status: ProjectStatus; // int enum
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
  result: T;
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

// Metadata cho UI: map số -> label + style
export const STATUS_META: Record<
  ProjectStatusEnum,
  { label: string; color: string; bg: string; text: string }
> = {
  [ProjectStatusEnum.PLANNING]: {
    label: "Planning",
    color: "default",
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
  [ProjectStatusEnum.ACTIVE]: {
    label: "Active",
    color: "green",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  [ProjectStatusEnum.PAUSED]: {
    label: "Paused",
    color: "orange",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  [ProjectStatusEnum.DONE]: {
    label: "Done",
    color: "blue",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
};
