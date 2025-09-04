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

/**
 * Hành vi khi 403:
 *  - "login": coi 403 như phiên/quyền không hợp lệ -> xoá token & về /login
 *  - "forbidden": giữ token, chuyển người dùng tới /forbidden
 */
const FORBIDDEN_BEHAVIOR = (process.env.NEXT_PUBLIC_FORBIDDEN_BEHAVIOR ||
  "login") as "login" | "forbidden";

/** Có xoá token khi 403 với chế độ forbidden hay không (mặc định: false) */
const FORBIDDEN_CLEAR_TOKEN =
  (process.env.NEXT_PUBLIC_FORBIDDEN_CLEAR_TOKEN ?? "false") === "true";

/** Các path công khai không cần redirect (tránh lặp) */
const PUBLIC_PATHS = new Set<string>(["/login", "/forbidden"]);

/** Trạng thái cục bộ để tránh bắn nhiều redirect đồng thời */
let redirecting = false;

const isBrowser = () => typeof window !== "undefined";
const nowPath = () => (isBrowser() ? window.location.pathname : "/");

const getToken = () => (isBrowser() && localStorage.getItem("token")) || null;

const setToken = (t: string | null) => {
  if (!isBrowser()) return;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

const safeRedirect = (to: string, reason?: string) => {
  if (!isBrowser() || redirecting) return;
  if (PUBLIC_PATHS.has(nowPath())) return; // đang ở trang public -> khỏi redirect
  redirecting = true;
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  window.location.href = `${to}${query}`;
};

const isAuthCall = (args: string | FetchArgs) => {
  const url =
    typeof args === "string"
      ? args
      : typeof args?.url === "string"
      ? args.url
      : "";
  // Tránh trigger redirect vòng lặp cho các endpoint auth
  return url.startsWith("/api/auth");
};

export const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  // BẬT nếu dùng cookie refresh thực sự
  // credentials: "include",
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
    // Không ép content-type; fetchBaseQuery tự set khi body là JSON
    return headers;
  },
});

/**
 * BaseQuery tổng hợp:
 * - 401: luôn xoá token + chuyển /login
 * - 403: tuỳ cấu hình:
 *    + "login": xoá token + chuyển /login
 *    + "forbidden": (mặc định giữ token) chuyển /forbidden
 */
export const baseQueryWithAuthGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  const res = await rawBaseQuery(args, api, extra);

  const status = res.error?.status;

  // Bỏ qua xử lý nếu call auth (tránh vòng lặp redirect)
  if (isAuthCall(args)) return res;

  if (status === 401) {
    // Phiên hết hạn / token không hợp lệ -> reset & về login
    setToken(null);
    safeRedirect("/login", "expired");
    return res;
  }

  if (status === 403) {
    if (FORBIDDEN_BEHAVIOR === "login") {
      // Xem 403 như role/phiên không hợp lệ -> reset & login
      setToken(null);
      safeRedirect("/login", "forbidden");
    } else {
      // Điều hướng tới trang cấm truy cập (giữ token mặc định)
      if (FORBIDDEN_CLEAR_TOKEN) setToken(null);
      if (!PUBLIC_PATHS.has(nowPath())) {
        safeRedirect("/forbidden");
      }
    }
    return res;
  }

  return res;
};

// Export tên ngắn cho app dùng
export const baseQuery = baseQueryWithAuthGuard;
