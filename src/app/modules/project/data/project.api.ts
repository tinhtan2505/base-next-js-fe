"use client";

import dayjs from "dayjs";
import { rootApi } from "@/app/shared/api/api";

import type {
  CustomResponse,
  Project,
  ProjectCreateRequest,
} from "../libs/types";
import { getStompClient } from "@/app/lib/realtime/socketSlice";

type CrudAction = "CREATED" | "UPDATED" | "DELETED";
type CrudEvent<T = unknown> = {
  action: CrudAction;
  entity: string;
  id: string;
  data: T | null;
  actor: string;
  ts: number;
};
type WsEnvelope<T = unknown> = { event: CrudEvent<T> };

export const projectApi = rootApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      query: () => `/api/project/find-all`,
      transformResponse: (resp: CustomResponse<Project[]>) =>
        Array.isArray(resp?.result) ? resp.result : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Projects" as const, id: p.id })),
              { type: "Projects", id: "LIST" },
            ]
          : [{ type: "Projects", id: "LIST" }],
      keepUnusedDataFor: 60,
      async onCacheEntryAdded(_arg, { updateCachedData, cacheEntryRemoved }) {
        const client = getStompClient(
          () =>
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null,
          {
            useSockJS: true,
            virtualHost: process.env.NEXT_PUBLIC_WS_VHOST || undefined,
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: false,
          }
        );

        let unsubFn: (() => void) | undefined;

        const subscribeList = () => {
          // hủy sub cũ nếu có
          unsubFn?.();

          const sub = client.subscribe("/topic/projects", (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                event?: {
                  action: "CREATED" | "UPDATED" | "DELETED";
                  entity: string;
                  id: string;
                  data: Project | null;
                  actor: string;
                  ts: number;
                };
              };
              const e = payload.event;
              if (!e || e.entity !== "Project") return;

              updateCachedData((draft) => {
                switch (e.action) {
                  case "CREATED":
                    if (e.data && !draft.find((x) => String(x.id) === e.id)) {
                      draft.unshift(e.data);
                    }
                    break;
                  case "UPDATED": {
                    const i = draft.findIndex((x) => String(x.id) === e.id);
                    if (i !== -1 && e.data) draft[i] = e.data;
                    break;
                  }
                  case "DELETED": {
                    const i = draft.findIndex((x) => String(x.id) === e.id);
                    if (i !== -1) draft.splice(i, 1);
                    break;
                  }
                }
                // sort desc theo updatedAt
                draft.sort((a, b) => {
                  const vb = dayjs(b.updatedAt).isValid()
                    ? dayjs(b.updatedAt).valueOf()
                    : 0;
                  const va = dayjs(a.updatedAt).isValid()
                    ? dayjs(a.updatedAt).valueOf()
                    : 0;
                  return vb - va;
                });
              });
            } catch {}
          });

          // wrap StompSubscription -> () => void
          unsubFn = () => {
            try {
              sub.unsubscribe();
            } catch {}
          };
        };

        const prevOnConnect = client.onConnect;
        client.onConnect = (frame) => {
          subscribeList();
          prevOnConnect?.(frame);
        };

        if (client.connected) subscribeList();

        await cacheEntryRemoved;
        unsubFn?.();
        client.onConnect = prevOnConnect || (() => {});
      },
    }),

    getProjectById: build.query<Project, string>({
      query: (id) => `/api/project/${id}`,
      transformResponse: (resp: CustomResponse<Project>) => resp.result,
      providesTags: (_res, _err, id) => [{ type: "Projects", id }],
      async onCacheEntryAdded(id, { updateCachedData, cacheEntryRemoved }) {
        const client = getStompClient(
          () =>
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null,
          {
            useSockJS: true,
            virtualHost: process.env.NEXT_PUBLIC_WS_VHOST || undefined,
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: false,
          }
        );

        let unsubs: Array<() => void> = [];

        const doSubscribe = () => {
          // hủy mọi sub cũ rồi đăng ký lại
          unsubs.forEach((off) => {
            try {
              off();
            } catch {}
          });
          unsubs = [];

          // 1) Kênh chi tiết
          const subDetail = client.subscribe(`/topic/projects/${id}`, (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                event?: {
                  action: "CREATED" | "UPDATED" | "DELETED";
                  entity: string;
                  id: string;
                  data: Project | null;
                  actor: string;
                  ts: number;
                };
              };
              const e = payload.event;
              if (!e || e.entity !== "Project" || e.id !== String(id)) return;
              if (e.action === "DELETED") return; // tuỳ chính sách có thể điều hướng/invalidates
              if (e.data)
                updateCachedData((draft) => Object.assign(draft, e.data));
            } catch {}
          });
          unsubs.push(() => {
            try {
              subDetail.unsubscribe();
            } catch {}
          });

          // 2) Fallback kênh list
          const subList = client.subscribe(`/topic/projects`, (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                event?: {
                  action: "CREATED" | "UPDATED" | "DELETED";
                  entity: string;
                  id: string;
                  data: Project | null;
                  actor: string;
                  ts: number;
                };
              };
              const e = payload.event;
              if (!e || e.entity !== "Project" || e.id !== String(id)) return;
              if (e.action === "DELETED") return;
              if (e.data)
                updateCachedData((draft) => Object.assign(draft, e.data));
            } catch {}
          });
          unsubs.push(() => {
            try {
              subList.unsubscribe();
            } catch {}
          });
        };

        const prevOnConnect = client.onConnect;
        client.onConnect = (frame) => {
          doSubscribe();
          prevOnConnect?.(frame);
        };

        if (client.connected) doSubscribe();

        await cacheEntryRemoved;
        unsubs.forEach((off) => {
          try {
            off();
          } catch {}
        });
        client.onConnect = prevOnConnect || (() => {});
      },
    }),

    createProject: build.mutation<Project, ProjectCreateRequest>({
      query: (body) => {
        console.log("Body gửi lên API:", body);
        return { url: `/api/project`, method: "POST", body };
      },
      transformResponse: (resp: CustomResponse<Project>) => resp.result,
      async onQueryStarted(newItem, { dispatch, queryFulfilled }) {
        // Optimistic: chèn temp vào đầu danh sách
        const patch = dispatch(
          projectApi.util.updateQueryData("getProjects", undefined, (draft) => {
            draft.unshift({
              // tạm thời dùng giá trị người dùng nhập + id temp
              ...(newItem as unknown as Project),
              id: "temp-" + Math.random().toString(36).slice(2),
              // fallback timestamp để sort ổn định
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });
          })
        );
        try {
          const { data: created } = await queryFulfilled; // Project
          dispatch(
            projectApi.util.updateQueryData(
              "getProjects",
              undefined,
              (draft) => {
                const i = draft.findIndex((x) =>
                  String(x.id).startsWith("temp-")
                );
                if (i !== -1) draft[i] = created;
                // sort desc theo updatedAt
                draft.sort((a, b) => {
                  const vb = dayjs(b.updatedAt).isValid()
                    ? dayjs(b.updatedAt).valueOf()
                    : 0;
                  const va = dayjs(a.updatedAt).isValid()
                    ? dayjs(a.updatedAt).valueOf()
                    : 0;
                  return vb - va;
                });
              }
            )
          );
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),

    updateProject: build.mutation<
      Project,
      { id: string; body: Partial<ProjectCreateRequest> }
    >({
      query: ({ id, body }) => {
        console.log("Body gửi lên API:", body);
        return {
          url: `/api/project/${id}`,
          method: "PUT",
          body,
        };
      },
      transformResponse: (resp: CustomResponse<Project>) => resp.result,
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        // Lưu patch để rollback nếu lỗi
        const patchList = dispatch(
          projectApi.util.updateQueryData("getProjects", undefined, (draft) => {
            const i = draft.findIndex((x) => x.id === id);
            if (i !== -1) {
              const patchFields = body as Partial<Project>;
              draft[i] = {
                ...draft[i],
                ...patchFields,
                updatedAt: new Date().toISOString(),
              };
            }
            draft.sort((a, b) => {
              const vb = dayjs(b.updatedAt).isValid()
                ? dayjs(b.updatedAt).valueOf()
                : 0;
              const va = dayjs(a.updatedAt).isValid()
                ? dayjs(a.updatedAt).valueOf()
                : 0;
              return vb - va;
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
        }
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Projects", id },
        { type: "Projects", id: "LIST" },
      ],
    }),
    deleteProject: build.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/api/project/${id}`,
        method: "DELETE",
      }),
      transformResponse: (resp: CustomResponse<{ id: string }>) => resp.result,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          projectApi.util.updateQueryData("getProjects", undefined, (draft) => {
            const i = draft.findIndex((x) => x.id === id);
            if (i !== -1) draft.splice(i, 1);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_res, _err, id) => [
        { type: "Projects", id },
        { type: "Projects", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

// ---- Hooks ----
export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
