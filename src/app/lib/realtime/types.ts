export type RealtimeAction = "CREATED" | "UPDATED" | "DELETED";

export type RealtimeEvent<T> = {
  action: RealtimeAction;
  resource: string; // ví dụ "projects"
  id: string; // id entity (UUID/string)
  actor: string; // username thực hiện
  at: string; // ISO datetime
  body: T; // chính entity (hoặc DTO nhẹ hơn tùy BE)
};
