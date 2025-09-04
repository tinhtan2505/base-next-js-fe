"use client";

import React, { useMemo, useState } from "react";
import { Button, Card, Modal, Space, Tooltip, Typography, message } from "antd";
import {
  ExclamationCircleOutlined,
  ExportOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { Project, ProjectStatus, ProjectStatusEnum } from "../libs/types";
import { exportProjectsCsv } from "../libs/csv";
import { StatsCards } from "./StatsCards";
import { FiltersBar } from "./FiltersBar";
import { ProjectTable } from "./ProjectTable";
import ProjectFormDrawer from "./ProjectFormDrawer";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "../data/project.api";

const ProjectPage: React.FC = () => {
  const { data: projects = [], isFetching, refetch } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (record: Project) => {
    setEditing(record);
    setDrawerOpen(true);
  };

  // CREATE
  const handleCreate = async (
    vals: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
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

  // UPDATE
  const handleUpdate = async (
    vals: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!editing) return;
    await updateProject({ id: editing.id, body: vals }).unwrap();
    setDrawerOpen(false);
    setEditing(null);
    message.success("Cập nhật thành công");
  };

  // DELETE (single)
  const handleDelete = async (id: string) => {
    await deleteProject(id).unwrap();
    setSelectedRowKeys((ks) => ks.filter((k) => k !== id));
    message.success("Đã xóa dự án");
  };

  // BULK DELETE (dùng Promise.all hoặc làm endpoint bulk ở server)
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: "Xóa các dự án đã chọn?",
      icon: <ExclamationCircleOutlined />,
      content: "Hành động này không thể hoàn tác",
      okButtonProps: { danger: true, loading: isDeleting },
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        await Promise.all(
          (selectedRowKeys as string[]).map((id) => deleteProject(id).unwrap())
        );
        setSelectedRowKeys([]);
        message.success("Đã xóa các dự án đã chọn");
      },
    });
  };

  const handleExportCSV = () => {
    exportProjectsCsv(filtered);
  };

  const refresh = () => {
    refetch();
  };

  // Derived (lọc client)
  const filtered = useMemo(() => {
    let list = [...projects].sort(
      (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
    );

    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter((x) =>
        [x.name, x.code, x.owner, x.description, ...(x.tags || [])]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(t))
      );
    }
    if (status !== "all") list = list.filter((x) => x.status === status);
    if (dateRange?.[0] && dateRange?.[1]) {
      const [s, e] = dateRange;
      list = list.filter((x) => {
        const d = dayjs(x.startDate);
        return d.isAfter(s!.startOf("day")) && d.isBefore(e!.endOf("day"));
      });
    }
    return list;
  }, [projects, q, status, dateRange]);

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
            Next.js + Ant Design + Tailwind. Dữ liệu lấy từ API.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Tooltip title="Xuất CSV">
            <Button icon={<ExportOutlined />} onClick={handleExportCSV}>
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Làm mới">
            <Button
              icon={<ReloadOutlined />}
              loading={isFetching}
              onClick={refresh}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            loading={isCreating || isUpdating}
          >
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
          loading={isFetching}
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
