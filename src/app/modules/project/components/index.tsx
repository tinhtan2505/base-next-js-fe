"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

// ==========================
// Types & Helpers
// ==========================

type ProjectStatus = "planning" | "active" | "paused" | "done";

type Project = {
  id: string;
  code: string;
  name: string;
  owner: string;
  status: ProjectStatus;
  startDate: string; // ISO
  dueDate?: string; // ISO
  budget?: number;
  progress?: number; // 0-100
  tags?: string[];
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; text: string }
> = {
  planning: {
    label: "Planning",
    color: "default",
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
  active: {
    label: "Active",
    color: "green",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  paused: {
    label: "Paused",
    color: "orange",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  done: {
    label: "Done",
    color: "blue",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
};

const STORAGE_KEY = "demo.projects.v1";

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
    status: "active",
    startDate: dayjs().subtract(30, "day").toISOString(),
    dueDate: dayjs().add(30, "day").toISOString(),
    budget: 500000000,
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
    status: "planning",
    startDate: dayjs().toISOString(),
    dueDate: dayjs().add(90, "day").toISOString(),
    budget: 300000000,
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
    status: "paused",
    startDate: dayjs().subtract(120, "day").toISOString(),
    dueDate: dayjs().add(10, "day").toISOString(),
    budget: 1200000000,
    progress: 45,
    tags: ["data", "etl"],
    description: "Nâng cấp hệ thống ETL và báo cáo.",
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
  },
];

// LocalStorage-backed mini-DB for demo
const db = {
  read(): Project[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(raw) as Project[];
    } catch (e) {
      console.error("Failed to parse storage, reseeding", e);
      const seeded = seedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  },
  write(items: Project[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },
  create(payload: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
    const item: Project = {
      ...payload,
      id: uid(),
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
    };
    const current = db.read();
    const next = [item, ...current];
    db.write(next);
    return item;
  },
  update(id: string, patch: Partial<Project>): Project | undefined {
    const current = db.read();
    const idx = current.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const nextItem = {
      ...current[idx],
      ...patch,
      updatedAt: dayjs().toISOString(),
    } as Project;
    const next = [...current];
    next[idx] = nextItem;
    db.write(next);
    return nextItem;
  },
  remove(id: string) {
    const current = db.read();
    const next = current.filter((x) => x.id !== id);
    db.write(next);
  },
  bulkRemove(ids: string[]) {
    const current = db.read();
    const set = new Set(ids);
    const next = current.filter((x) => !set.has(x.id));
    db.write(next);
  },
};

// ==========================
// Form Component
// ==========================

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
  initial?: Partial<Project> | null;
}

const statusOptions = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "done", label: "Done" },
] satisfies { value: ProjectStatus; label: string }[];

const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onClose,
  onSubmit,
  initial,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initial) {
        form.setFieldsValue({
          ...initial,
          dateRange: [
            initial.startDate ? dayjs(initial.startDate) : undefined,
            initial.dueDate ? dayjs(initial.dueDate) : undefined,
          ].filter(Boolean),
          tags: initial.tags ?? [],
        });
      }
    }
  }, [open, initial, form]);

  const handleFinish = (vals: {
    code: string;
    name: string;
    owner: string;
    status: ProjectStatus;
    dateRange?: [Dayjs?, Dayjs?];
    budget?: number;
    progress?: number;
    tags?: string[];
    description?: string;
  }) => {
    const [start, due] = (vals.dateRange || []) as Dayjs[];
    onSubmit({
      code: vals.code?.trim(),
      name: vals.name?.trim(),
      owner: vals.owner?.trim(),
      status: vals.status as ProjectStatus,
      startDate: start ? start.toISOString() : dayjs().toISOString(),
      dueDate: due ? due.toISOString() : undefined,
      budget: vals.budget ? Number(vals.budget) : undefined,
      progress: typeof vals.progress === "number" ? vals.progress : 0,
      tags: vals.tags || [],
      description: vals.description?.trim(),
    });
  };

  return (
    <Drawer
      title={initial?.id ? "Cập nhật dự án" : "Tạo dự án mới"}
      open={open}
      onClose={onClose}
      width={560}
      destroyOnClose
      styles={{ body: { paddingBottom: 24 } }}
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" onClick={() => form.submit()}>
            {initial?.id ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ status: "planning", progress: 0 }}
      >
        <Form.Item
          name="code"
          label="Mã dự án"
          rules={[{ required: true, message: "Nhập mã dự án" }]}
        >
          <Input placeholder="VD: PRJ-001" maxLength={32} allowClear />
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên dự án"
          rules={[{ required: true, message: "Nhập tên dự án" }]}
        >
          <Input placeholder="Tên dự án" allowClear />
        </Form.Item>

        <Form.Item
          name="owner"
          label="Chủ dự án"
          rules={[{ required: true, message: "Nhập chủ dự án" }]}
        >
          <Input placeholder="VD: Nguyễn Văn A" allowClear />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái">
          <Segmented
            block
            options={statusOptions.map((s) => ({
              label: s.label,
              value: s.value,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Thời gian"
          rules={[
            {
              validator: (_, value: Dayjs[] | undefined) => {
                if (!value || value.length === 0) return Promise.resolve();
                const [s, e] = value;
                if (s && e && e.isBefore(s))
                  return Promise.reject("Ngày kết thúc phải sau ngày bắt đầu");
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker.RangePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="budget" label="Ngân sách (VND)">
          <InputNumber
            className="w-full"
            min={0}
            step={1000000}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={() => 0}
          />
        </Form.Item>

        <Form.Item name="progress" label="Tiến độ (%)">
          <InputNumber className="w-full" min={0} max={100} />
        </Form.Item>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Nhập và Enter để thêm" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={4} placeholder="Mô tả ngắn về dự án" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

// ==========================
// Main Component
// ==========================

const ProjectPage: React.FC = () => {
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

  // Load data from storage
  useEffect(() => {
    setLoading(true);
    const items = db.read();
    // sort by updatedAt desc
    items.sort(
      (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
    );
    setData(items);
    setLoading(false);
  }, []);

  const refresh = () => {
    setLoading(true);
    const items = db.read();
    items.sort(
      (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
    );
    setData(items);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: Project) => {
    setEditing(record);
    setDrawerOpen(true);
  };

  // CRUD Handlers
  const handleCreate = (
    vals: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    const created = db.create(vals);
    setData((prev) => [created, ...prev]);
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
    const rows = [
      [
        "ID",
        "Code",
        "Name",
        "Owner",
        "Status",
        "Start Date",
        "Due Date",
        "Budget",
        "Progress",
        "Tags",
        "Updated At",
      ],
      ...filtered.map((p) => [
        p.id,
        p.code,
        p.name,
        p.owner,
        STATUS_META[p.status].label,
        dayjs(p.startDate).format("YYYY-MM-DD"),
        p.dueDate ? dayjs(p.dueDate).format("YYYY-MM-DD") : "",
        p.budget ?? "",
        (p.progress ?? 0).toString(),
        (p.tags || []).join("|"),
        dayjs(p.updatedAt).format("YYYY-MM-DD HH:mm"),
      ]),
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_${dayjs().format("YYYYMMDD_HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    const active = filtered.filter((x) => x.status === "active").length;
    const done = filtered.filter((x) => x.status === "done").length;
    const avgProgress = Math.round(
      filtered.reduce((acc, cur) => acc + (cur.progress || 0), 0) / (total || 1)
    );
    return { total, active, done, avgProgress };
  }, [filtered]);

  const columns: ColumnsType<Project> = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (text) => <span className="font-medium">{text}</span>,
      width: 120,
      fixed: "left",
    },
    {
      title: "Tên dự án",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">{record.name}</span>
          <span className="text-xs text-gray-500">{record.description}</span>
        </Space>
      ),
      ellipsis: true,
    },
    {
      title: "Chủ dự án",
      dataIndex: "owner",
      key: "owner",
      width: 160,
      sorter: (a, b) => a.owner.localeCompare(b.owner),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: statusOptions.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
      render: (v: ProjectStatus) => (
        <Tag
          color={
            STATUS_META[v].color as React.ComponentProps<typeof Tag>["color"]
          }
        >
          {STATUS_META[v].label}
        </Tag>
      ),
      width: 130,
    },
    {
      title: "Bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      sorter: (a, b) =>
        dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
      render: (v: string) => dayjs(v).format("YYYY-MM-DD"),
      width: 120,
    },
    {
      title: "Kết thúc",
      dataIndex: "dueDate",
      key: "dueDate",
      sorter: (a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf(),
      render: (v?: string) =>
        v ? (
          dayjs(v).format("YYYY-MM-DD")
        ) : (
          <span className="text-gray-400">—</span>
        ),
      width: 120,
    },
    {
      title: "Ngân sách",
      dataIndex: "budget",
      key: "budget",
      align: "right",
      sorter: (a, b) => (a.budget || 0) - (b.budget || 0),
      render: (v?: number) => (v ? v.toLocaleString("vi-VN") : "—"),
      width: 140,
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      align: "right",
      sorter: (a, b) => (a.progress || 0) - (b.progress || 0),
      render: (v?: number) => (v ?? 0) + "%",
      width: 110,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags?: string[]) => (
        <Space size={[4, 8]} wrap>
          {(tags || []).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </Space>
      ),
      width: 220,
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
      width: 160,
      sorter: (a, b) =>
        dayjs(a.updatedAt).valueOf() - dayjs(b.updatedAt).valueOf(),
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa dự án"
              description={`Bạn chắc chắn xóa "${record.name}"?`}
              okButtonProps={{ danger: true }}
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Row Selection
  const rowSelection: TableProps<Project>["rowSelection"] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card size="small">
          <div className="text-xs text-gray-500">Tổng</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </Card>
        <Card size="small">
          <div className="text-xs text-gray-500">Đang chạy</div>
          <div className="text-xl font-semibold">{stats.active}</div>
        </Card>
        <Card size="small">
          <div className="text-xs text-gray-500">Hoàn thành</div>
          <div className="text-xl font-semibold">{stats.done}</div>
        </Card>
        <Card size="small">
          <div className="text-xs text-gray-500">TB tiến độ</div>
          <div className="text-xl font-semibold">{stats.avgProgress}%</div>
        </Card>
      </div>

      {/* Filters */}
      <Card size="small" className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input.Search
              allowClear
              placeholder="Tìm theo tên, mã, chủ dự án, mô tả, tag"
              onSearch={setQ}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <Select
              className="min-w-[180px] w-full"
              value={status}
              onChange={(v) => setStatus(v as ProjectStatus | "all")}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                ...statusOptions,
              ]}
            />
          </div>
          <div className="w-full md:w-auto">
            <DatePicker.RangePicker
              className="w-full"
              value={
                dateRange
                  ? [dateRange[0] ?? null, dateRange[1] ?? null]
                  : [null, null]
              }
              onChange={(v: [Dayjs | null, Dayjs | null] | null) =>
                setDateRange(v)
              }
              placeholder={["Bắt đầu từ", "Đến ngày"]}
            />
          </div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
              >
                Xóa đã chọn ({selectedRowKeys.length})
              </Button>
            </Space>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table<Project>
          rowKey="id"
          size="middle"
          loading={loading}
          dataSource={filtered}
          columns={columns}
          rowSelection={rowSelection}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
        />
      </Card>

      {/* Drawer Form */}
      <ProjectForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
    </div>
  );
};

export default ProjectPage;
