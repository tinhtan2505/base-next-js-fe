"use client";

import dayjs from "dayjs";
import { rootApi } from "@/app/shared/api/api";
import {
  getStompClient,
  ensureConnected,
  stompSubscribe,
  stompUnsubscribe,
} from "@/app/lib/realtime/stompClient";
// import type { WsEnvelope } from "../libs/realtime.types";
import type { IMessage } from "@stomp/stompjs";

import type {
  CustomResponse,
  Project,
  ProjectCreateRequest,
} from "../libs/types";
import { WsEnvelope } from "@/app/lib/realtime/realtime.types";
import { RootState } from "@/app/store/store";

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
      // async onCacheEntryAdded(
      //   _arg,
      //   {
      //     cacheDataLoaded,
      //     cacheEntryRemoved,
      //     updateCachedData,
      //     dispatch,
      //     getState,
      //   }
      // ) {
      //   await cacheDataLoaded;

      //   const client = getStompClient({
      //     url: process.env.NEXT_PUBLIC_WS_URL || "/ws",
      //     useSockJS: true,
      //     getAuthToken: () => {
      //       if (typeof window !== "undefined") {
      //         return localStorage.getItem("token") ?? undefined; // ✅ lấy token từ localStorage
      //       }
      //       return undefined;
      //     },
      //     debug: false,
      //   });

      //   try {
      //     await ensureConnected(client);
      //   } catch {
      //     // không throw để không phá cache lifecycle
      //     return;
      //   }

      //   const LIST_TOPIC = "/topic/projects";
      //   const onListMessage = (msg: IMessage) => {
      //     const body = msg.body
      //       ? (JSON.parse(msg.body) as WsEnvelope<Project>)
      //       : null;
      //     const evt = body?.event;
      //     if (!evt) return;

      //     updateCachedData((draft) => {
      //       const id = evt.id;
      //       if (!id) return;

      //       if (evt.action === "CREATED" && evt.data) {
      //         const i = draft.findIndex((x) => String(x.id) === id);
      //         if (i === -1) draft.unshift(evt.data);
      //         else draft[i] = evt.data;
      //       } else if (evt.action === "UPDATED" && evt.data) {
      //         const i = draft.findIndex((x) => String(x.id) === id);
      //         if (i !== -1) draft[i] = { ...draft[i], ...evt.data };
      //         else draft.unshift(evt.data);
      //       } else if (evt.action === "DELETED") {
      //         const i = draft.findIndex((x) => String(x.id) === id);
      //         if (i !== -1) draft.splice(i, 1);
      //       }

      //       draft.sort((a, b) => {
      //         const vb = dayjs(b.updatedAt).isValid()
      //           ? dayjs(b.updatedAt).valueOf()
      //           : 0;
      //         const va = dayjs(a.updatedAt).isValid()
      //           ? dayjs(a.updatedAt).valueOf()
      //           : 0;
      //         return vb - va;
      //       });
      //     });

      //     // đồng bộ cache chi tiết nếu có
      //     const id = body?.event?.id;
      //     const data = body?.event?.data;
      //     if (id) {
      //       if (body?.event?.action === "DELETED") {
      //         dispatch(
      //           projectApi.util.invalidateTags([{ type: "Projects", id }])
      //         );
      //       } else if (data) {
      //         dispatch(
      //           projectApi.util.updateQueryData(
      //             "getProjectById",
      //             id,
      //             (draft) => {
      //               Object.assign(draft, data);
      //             }
      //           )
      //         );
      //       }
      //     }
      //   };

      //   stompSubscribe(client, LIST_TOPIC, onListMessage);

      //   await cacheEntryRemoved;
      //   stompUnsubscribe(LIST_TOPIC);
      // },
    }),

    getProjectById: build.query<Project, string>({
      query: (id) => `/api/project/${id}`,
      transformResponse: (resp: CustomResponse<Project>) => resp.result,
      providesTags: (_res, _err, id) => [{ type: "Projects", id }],
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
