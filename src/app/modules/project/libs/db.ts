import dayjs from "dayjs";
import { Project } from "./types";

const STORAGE_KEY = "demo.projects.v1";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const db = {
  read(): Project[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Project[];
    } catch {
      return [];
    }
  },
  write(items: Project[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },
  create(payload: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
    const item: Project = {
      ...payload,
      id: uid(),
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
    };
    const current = db.read();
    const next = [item, ...current];
    db.write(next);
    return item;
  },
  update(id: string, patch: Partial<Project>): Project | undefined {
    const current = db.read();
    const idx = current.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const nextItem = {
      ...current[idx],
      ...patch,
      updatedAt: dayjs().toISOString(),
    } as Project;
    const next = [...current];
    next[idx] = nextItem;
    db.write(next);
    return nextItem;
  },
  remove(id: string) {
    const current = db.read();
    db.write(current.filter((x) => x.id !== id));
  },
  bulkRemove(ids: string[]) {
    const current = db.read();
    const set = new Set(ids);
    db.write(current.filter((x) => !set.has(x.id)));
  },
};
