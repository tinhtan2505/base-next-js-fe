import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Dayjs } from "dayjs";
import type { Project, ProjectStatus } from "../libs/types";

type Filters = {
  q: string;
  status: ProjectStatus | "all";
  dateRange: [Dayjs | null, Dayjs | null] | null;
};

type UIState = {
  drawerOpen: boolean;
  editing: Project | null;
  selectedRowKeys: React.Key[];
  filters: Filters;
};

const initialState: UIState = {
  drawerOpen: false,
  editing: null,
  selectedRowKeys: [],
  filters: { q: "", status: "all", dateRange: null },
};

const slice = createSlice({
  name: "projectUI",
  initialState,
  reducers: {
    setDrawerOpen: (s, a: PayloadAction<boolean>) => {
      s.drawerOpen = a.payload;
    },
    setEditing: (s, a: PayloadAction<Project | null>) => {
      s.editing = a.payload;
    },
    setSelectedRowKeys: (s, a: PayloadAction<React.Key[]>) => {
      s.selectedRowKeys = a.payload;
    },
    setFilters: (s, a: PayloadAction<Partial<Filters>>) => {
      s.filters = { ...s.filters, ...a.payload };
    },
    resetFilters: (s) => {
      s.filters = initialState.filters;
    },
  },
});

export const {
  setDrawerOpen,
  setEditing,
  setSelectedRowKeys,
  setFilters,
  resetFilters,
} = slice.actions;
export default slice.reducer;
