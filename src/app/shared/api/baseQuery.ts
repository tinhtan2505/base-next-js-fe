import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

// Cấu hình baseUrl từ ENV
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  prepareHeaders: (headers) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
  credentials: "include", // nếu dùng cookie refresh
});

// (tuỳ chọn) Tự động refresh token khi 401
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refresh = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );
    if ("data" in refresh) {
      type RefreshResponse = { accessToken: string };
      const token = (refresh.data as RefreshResponse)?.accessToken;
      if (token) localStorage.setItem("access_token", token);
      result = await rawBaseQuery(args, api, extraOptions); // retry
    }
  }
  return result;
};
