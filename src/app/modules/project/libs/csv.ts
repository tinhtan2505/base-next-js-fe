import dayjs from "dayjs";
import { Project, STATUS_META } from "./types";

export function exportProjectsCsv(projects: Project[]) {
  const rows = [
    [
      "ID",
      "Code",
      "Name",
      "Owner",
      "Status",
      "Start Date",
      "Due Date",
      "Budget",
      "Progress",
      "Tags",
      "Updated At",
    ],
    ...projects.map((p) => [
      p.id,
      p.code,
      p.name,
      p.owner,
      STATUS_META[p.status].label,
      dayjs(p.startDate).format("YYYY-MM-DD"),
      p.dueDate ? dayjs(p.dueDate).format("YYYY-MM-DD") : "",
      p.budget ?? "",
      (p.progress ?? 0).toString(),
      (p.tags || []).join("|"),
      dayjs(p.updatedAt).format("YYYY-MM-DD HH:mm"),
    ]),
  ]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `projects_${dayjs().format("YYYYMMDD_HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
