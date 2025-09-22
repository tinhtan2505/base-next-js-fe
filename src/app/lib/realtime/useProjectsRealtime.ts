// "use client";

// import { useCallback } from "react";
// import { useDispatch } from "react-redux";
// import type { RealtimeEvent } from "./types";
// import dayjs from "dayjs";
// import { Project } from "@/app/modules/project/libs/types";
// import { projectApi } from "@/app/modules/project/data/project.api";
// import { useStompSubscription } from "@/app/shared/hooks/useStompSubscription";

// function sortByUpdatedAtDesc(list: Project[]) {
//   list.sort((a, b) => {
//     const vb = dayjs(b.updatedAt).isValid() ? dayjs(b.updatedAt).valueOf() : 0;
//     const va = dayjs(a.updatedAt).isValid() ? dayjs(a.updatedAt).valueOf() : 0;
//     return vb - va;
//   });
// }

// export function useProjectsRealtime() {
//   const dispatch = useDispatch();

//   const apply = useCallback(
//     (evt: RealtimeEvent<Project>) => {
//       if (!evt || evt.resource !== "projects") return;

//       const entity = evt.body;
//       const idStr = String(evt.id ?? entity?.id ?? "");

//       switch (evt.action) {
//         case "CREATED": {
//           // Cập nhật danh sách
//           dispatch(
//             projectApi.util.updateQueryData(
//               "getProjects",
//               undefined,
//               (draft) => {
//                 const i = draft.findIndex((p) => String(p.id) === idStr);
//                 if (i === -1) draft.unshift(entity);
//                 else draft[i] = entity;
//                 sortByUpdatedAtDesc(draft);
//               }
//             )
//           );
//           break;
//         }

//         case "UPDATED": {
//           // Cập nhật list
//           dispatch(
//             projectApi.util.updateQueryData(
//               "getProjects",
//               undefined,
//               (draft) => {
//                 const i = draft.findIndex((p) => String(p.id) === idStr);
//                 if (i !== -1) draft[i] = entity;
//                 else draft.unshift(entity);
//                 sortByUpdatedAtDesc(draft);
//               }
//             )
//           );
//           // Đồng bộ luôn cache get-by-id nếu đang mở
//           dispatch(
//             projectApi.util.updateQueryData(
//               "getProjectById",
//               idStr,
//               (draft) => {
//                 Object.assign(draft, entity);
//               }
//             )
//           );
//           break;
//         }

//         case "DELETED": {
//           dispatch(
//             projectApi.util.updateQueryData(
//               "getProjects",
//               undefined,
//               (draft) => {
//                 const i = draft.findIndex((p) => String(p.id) === idStr);
//                 if (i !== -1) draft.splice(i, 1);
//               }
//             )
//           );
//           // Nếu muốn mạnh tay hơn: dispatch(projectApi.util.invalidateTags([...]))
//           break;
//         }
//       }
//     },
//     [dispatch]
//   );

//   // Sub cả broadcast & user-queue
//   useStompSubscription<RealtimeEvent<Project>>("/topic/projects", apply);
//   useStompSubscription<RealtimeEvent<Project>>("/user/queue/projects", apply);
// }
