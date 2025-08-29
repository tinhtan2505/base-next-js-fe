"use client";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import projectUIReducer from "@/app/modules/project/data/project.ui.slice";
import { rootApi } from "../shared/api/api";
// (tuỳ) import thêm các slice khác

export const store = configureStore({
  reducer: {
    [rootApi.reducerPath]: rootApi.reducer,
    projectUI: projectUIReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false, // an toàn khi dùng RTKQ
    }).concat(rootApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
