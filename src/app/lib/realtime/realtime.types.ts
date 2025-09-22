export type CrudAction = "CREATED" | "UPDATED" | "DELETED";

export interface CrudEvent<T> {
  action: CrudAction;
  entity: string;
  id: string;
  data: T | null;
  actor?: string;
  ts: number;
}

export interface WsEnvelope<T> {
  event: CrudEvent<T>;
}
