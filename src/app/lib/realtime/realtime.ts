export type CrudAction = "CREATED" | "UPDATED" | "DELETED";

export interface CrudEvent<T = unknown> {
  action: CrudAction;
  entity: string; // e.g., "Project"
  id: string;
  data: T | null;
  actor: string;
  ts: number; // epoch millis
}

export interface WsEnvelope<T = unknown> {
  event: CrudEvent<T>;
}
