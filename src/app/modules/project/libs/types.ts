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

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; text: string }
> = {
  planning: {
    label: "Planning",
    color: "default",
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
  active: {
    label: "Active",
    color: "green",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  paused: {
    label: "Paused",
    color: "orange",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  done: {
    label: "Done",
    color: "blue",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
};
