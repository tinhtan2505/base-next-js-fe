"use client";

import dayjs from "dayjs";
import { rootApi } from "@/app/shared/api/api";
import type {
  CustomResponse,
  Project,
  ProjectCreateRequest,
} from "../libs/types";

export const projectApi = rootApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/project/find-all -> CustomResponse<Project[]>
    getProjects: build.query<Project[], void>({
      query: () => `/api/project/find-all`,
      transformResponse: (resp: CustomResponse<Project[]>) => resp.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Projects" as const, id: p.id })),
              { type: "Projects", id: "LIST" },
            ]
          : [{ type: "Projects", id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    // GET /api/project/{id}
    getProjectById: build.query<Project, string>({
      query: (id) => `/api/project/${id}`,
      transformResponse: (resp: CustomResponse<Project>) => resp.data,
      providesTags: (_res, _err, id) => [{ type: "Projects", id }],
    }),

    // POST /api/project -> 201 + CustomResponse<Project>
    createProject: build.mutation<Project, ProjectCreateRequest>({
      query: (body) => ({ url: `/api/project`, method: "POST", body }),
      transformResponse: (resp: CustomResponse<Project>) => resp.data,
      // Optimistic + sort updatedAt desc để khớp UI của bạn
      async onQueryStarted(newItem, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          projectApi.util.updateQueryData("getProjects", undefined, (draft) => {
            draft.unshift({
              ...newItem,
              id: "temp-" + Math.random().toString(36).slice(2),
              createdAt: dayjs().toISOString(),
              updatedAt: dayjs().toISOString(),
            } as Project);
          })
        );
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            projectApi.util.updateQueryData(
              "getProjects",
              undefined,
              (draft) => {
                const i = draft.findIndex((x) =>
                  String(x.id).startsWith("temp-")
                );
                if (i !== -1) draft[i] = created;
                draft.sort(
                  (a, b) =>
                    dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
                );
              }
            )
          );
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: "Projects", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
} = projectApi;
