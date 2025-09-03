"use client";

import dayjs from "dayjs";
import { rootApi } from "@/app/shared/api/api";
import type {
  CustomResponse,
  Project,
  ProjectCreateRequest,
} from "../libs/types";

/**
 * BE response shape:
 * {
 *   "message": "Thành công",
 *   "result": T,
 *   "metadata": null
 * }
 */

// ---- API slice ----
export const projectApi = rootApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /api/project/find-all
     * -> CustomResponse<Project[]>
     */
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
    }),

    /**
     * GET /api/project/{id}
     * -> CustomResponse<Project>
     */
    getProjectById: build.query<Project, string>({
      query: (id) => `/api/project/${id}`,
      transformResponse: (resp: CustomResponse<Project>) => resp.result,
      providesTags: (_res, _err, id) => [{ type: "Projects", id }],
    }),

    /**
     * POST /api/project
     * body: ProjectCreateRequest
     * -> CustomResponse<Project>
     *
     * Có optimistic update: đẩy temp item lên đầu list, sau đó
     * replace bằng dữ liệu server trả về, và sort theo updatedAt desc.
     */
    createProject: build.mutation<Project, ProjectCreateRequest>({
      query: (body) => ({ url: `/api/project`, method: "POST", body }),
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

    /**
     * PUT /api/project/{id}
     * body: Partial<ProjectCreateRequest>
     * -> CustomResponse<Project>
     *
     * Optimistic patch vào list + sort theo updatedAt desc.
     */
    updateProject: build.mutation<
      Project,
      { id: string; body: Partial<ProjectCreateRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/api/project/${id}`,
        method: "PUT",
        body,
      }),
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

    /**
     * DELETE /api/project/{id}
     * -> CustomResponse<{ id: string }>
     *
     * Optimistic: xóa khỏi cache trước, rollback nếu fail.
     */
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
