"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Modal, Space, Tooltip, Typography, message } from "antd";
import {
  ExclamationCircleOutlined,
  ExportOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { Project, ProjectStatus, ProjectStatusEnum } from "../libs/types";
import { db } from "../libs/db";
import { exportProjectsCsv } from "../libs/csv";
import { StatsCards } from "./StatsCards";
import { FiltersBar } from "./FiltersBar";
import { ProjectTable } from "./ProjectTable";
import ProjectFormDrawer from "./ProjectFormDrawer";
import {
  useCreateProjectMutation,
  useGetProjectsQuery,
} from "../data/project.api";

// --- seed demo data giống bản gốc ---
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const seedData = (): Project[] => [
  {
    id: uid(),
    code: "PRJ-001",
    name: "Hệ thống Thanh toán QR",
    owner: "Nguyễn Văn A",
    status: ProjectStatusEnum.ACTIVE,
    startDate: dayjs().subtract(30, "day").toISOString(),
    dueDate: dayjs().add(30, "day").toISOString(),
    budget: 500_000_000,
    progress: 62,
    tags: ["fintech", "qr", "vnpay"],
    description: "Tích hợp thanh toán QR cho web & mobile.",
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
  },
  {
    id: uid(),
    code: "PRJ-002",
    name: "CMS Bệnh viện",
    owner: "Trần Thị B",
    status: ProjectStatusEnum.PLANNING,
    startDate: dayjs().toISOString(),
    dueDate: dayjs().add(90, "day").toISOString(),
    budget: 300_000_000,
    progress: 10,
    tags: ["healthcare", "backend"],
    description: "Xây dựng CMS quản lý viện phí.",
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
  },
  {
    id: uid(),
    code: "PRJ-003",
    name: "Data Warehouse v2",
    owner: "Phạm C",
    status: ProjectStatusEnum.PAUSED,
    startDate: dayjs().subtract(120, "day").toISOString(),
    dueDate: dayjs().add(10, "day").toISOString(),
    budget: 1_200_000_000,
    progress: 45,
    tags: ["data", "etl"],
    description: "Nâng cấp hệ thống ETL và báo cáo.",
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
  },
];

const ProjectPage: React.FC = () => {
  const { data: projects = [], isFetching, refetch } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // Load data (with seed once if empty)
  const refresh = () => {
    setLoading(true);
    const items = db.read();
    items.sort(
      (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
    );
    setData(items);
    setLoading(false);
  };

  useEffect(() => {
    const items = db.read();
    if (!items || items.length === 0) {
      // seed lần đầu
      const seeded = seedData();
      db.write(seeded);
    }
    refresh();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: Project) => {
    setEditing(record);
    setDrawerOpen(true);
  };

  // CRUD Handlers
  const handleCreate = async (
    vals: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    // const created = db.create(vals);
    // setData((prev) =>
    //   [created, ...prev].sort(
    //     (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
    //   )
    // );
    console.log("Creating", vals);
    const STR2ENUM: Record<string, ProjectStatusEnum> = {
      planning: ProjectStatusEnum.PLANNING,
      active: ProjectStatusEnum.ACTIVE,
      paused: ProjectStatusEnum.PAUSED,
      done: ProjectStatusEnum.DONE,
    };
    const statusCode: ProjectStatusEnum =
      typeof vals.status === "number"
        ? (vals.status as ProjectStatusEnum)
        : STR2ENUM[String(vals.status).toLowerCase()] ??
          ProjectStatusEnum.PLANNING;

    await createProject({
      code: vals.code,
      name: vals.name,
      owner: vals.owner,
      status: statusCode,
      startDate: vals.startDate,
      dueDate: vals.dueDate,
      budget: vals.budget,
      progress: vals.progress,
      tags: vals.tags,
      description: vals.description,
    }).unwrap();
    setDrawerOpen(false);
    message.success("Tạo dự án thành công");
  };

  const handleUpdate = (
    vals: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!editing) return;
    const updated = db.update(editing.id, vals);
    if (updated) {
      setData((prev) => {
        const idx = prev.findIndex((x) => x.id === updated.id);
        const next = [...prev];
        next[idx] = updated;
        return next.sort(
          (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
        );
      });
      message.success("Cập nhật thành công");
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    db.remove(id);
    setData((prev) => prev.filter((x) => x.id !== id));
    setSelectedRowKeys((ks) => ks.filter((k) => k !== id));
    message.success("Đã xóa dự án");
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: "Xóa các dự án đã chọn?",
      icon: <ExclamationCircleOutlined />,
      content: "Hành động này không thể hoàn tác",
      okButtonProps: { danger: true },
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        db.bulkRemove(selectedRowKeys as string[]);
        setData((prev) => prev.filter((x) => !selectedRowKeys.includes(x.id)));
        setSelectedRowKeys([]);
        message.success("Đã xóa các dự án đã chọn");
      },
    });
  };

  const handleExportCSV = () => {
    exportProjectsCsv(filtered);
  };

  // Derived
  const filtered = useMemo(() => {
    let list = [...data];
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter((x) =>
        [x.name, x.code, x.owner, x.description, ...(x.tags || [])]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(t))
      );
    }
    if (status !== "all") list = list.filter((x) => x.status === status);
    if (dateRange && dateRange[0] && dateRange[1]) {
      const [s, e] = dateRange;
      list = list.filter((x) => {
        const d = dayjs(x.startDate);
        return d.isAfter(s!.startOf("day")) && d.isBefore(e!.endOf("day"));
      });
    }
    return list;
  }, [data, q, status, dateRange]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const active = filtered.filter(
      (x) => x.status === ProjectStatusEnum.ACTIVE
    ).length;
    const done = filtered.filter(
      (x) => x.status === ProjectStatusEnum.DONE
    ).length;
    const avgProgress = Math.round(
      filtered.reduce((acc, cur) => acc + (cur.progress || 0), 0) / (total || 1)
    );
    return { total, active, done, avgProgress };
  }, [filtered]);

  return (
    <div className="p-2 h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-4">
        <div>
          <Typography.Title level={3} className="!mb-1">
            Danh sách Project
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 text-gray-500">
            Giao diện Next.js + Ant Design + Tailwind. Dữ liệu demo lưu ở
            LocalStorage.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Tooltip title="Xuất CSV">
            <Button icon={<ExportOutlined />} onClick={handleExportCSV}>
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Làm mới">
            <Button icon={<ReloadOutlined />} onClick={refresh} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm Project
          </Button>
        </Space>
      </div>

      {/* Quick Stats */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <Card size="small" className="mb-4">
        <FiltersBar
          q={q}
          onQChange={setQ}
          status={status}
          onStatusChange={(v) => setStatus(v)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedCount={selectedRowKeys.length}
          onBulkDelete={handleBulkDelete}
          onExport={handleExportCSV}
          onRefresh={refresh}
          onCreate={openCreate}
        />
      </Card>

      {/* Table */}
      <Card styles={{ body: { padding: 0 } }}>
        <ProjectTable
          data={filtered}
          loading={loading}
          selectedRowKeys={selectedRowKeys}
          onRowKeysChange={setSelectedRowKeys}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* Drawer Form */}
      <ProjectFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
    </div>
  );
};

export default ProjectPage;
