import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const rootApi = createApi({
  reducerPath: "rootApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Projects"], // thêm các tag khác khi mở rộng
  endpoints: () => ({}),
});
