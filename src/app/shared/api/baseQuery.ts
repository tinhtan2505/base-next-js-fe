// src/app/shared/api/baseQuery.ts
"use client";

import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888";

// Đọc token từ localStorage (ưu tiên "token", fallback "token")
const getToken = () =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("token") || localStorage.getItem("token"))) ||
  null;

export const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  // Với JWT qua header, KHÔNG cần cookies. Bật dòng dưới chỉ khi bạn dùng cookie refresh thực sự.
  // credentials: "include",
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      // dùng 'authorization' (lowercase) lành hơn, không bị trùng/ghi đè bất ngờ
      headers.set("authorization", `Bearer ${token}`);
    }
    // KHÔNG ép Content-Type mọi request; fetchBaseQuery sẽ tự set khi body là JSON
    // headers.set("content-type", "application/json");
    return headers;
  },
});

// KHÔNG refresh vì BE chưa có endpoint refresh
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // Tuỳ chọn: bắt 401/403 để chuyển hướng login hoặc thông báo
  // if (result.error?.status === 401 || result.error?.status === 403) {
  //   // ví dụ:
  //   // localStorage.removeItem("token");
  //   // window.location.href = "/login";
  // }

  return result;
};

/* 
// Chỉ bật nếu BE đã có endpoint refresh ví dụ: POST /api/auth/refresh
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refresh = await rawBaseQuery(
      { url: "/api/auth/refresh", method: "POST" },
      api,
      extraOptions
    );
    if ("data" in refresh) {
      const token = (refresh.data as { accessToken: string })?.accessToken;
      if (token) localStorage.setItem("token", token);
      result = await rawBaseQuery(args, api, extraOptions); // retry
    }
  }
  return result;
};
*/
