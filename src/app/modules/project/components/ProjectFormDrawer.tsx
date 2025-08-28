"use client";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  DatePicker,
  Segmented,
} from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { Project, ProjectStatus } from "../libs/types";

interface Props {
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
] as const;

const ProjectFormDrawer: React.FC<Props> = ({
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
            initial.startDate ? dayjs(initial.startDate) : null,
            initial.dueDate ? dayjs(initial.dueDate) : null,
          ],
          tags: initial.tags ?? [],
        });
      }
    }
  }, [open, initial, form]);

  interface FormValues {
    code?: string;
    name?: string;
    owner?: string;
    status?: ProjectStatus;
    dateRange?: [Dayjs | null, Dayjs | null];
    budget?: number;
    progress?: number;
    tags?: string[];
    description?: string;
  }

  const handleFinish = (vals: FormValues) => {
    const [start, due] = vals.dateRange || [];
    onSubmit({
      code: vals.code?.trim() ?? "",
      name: vals.name?.trim() ?? "",
      owner: vals.owner?.trim() ?? "",
      status: vals.status ?? "planning",
      startDate: start ? start.toISOString() : dayjs().toISOString(),
      dueDate: due ? due.toISOString() : undefined,
      budget: vals.budget ? Number(vals.budget) : undefined,
      progress: vals.progress ?? 0,
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
        <Form.Item name="code" label="Mã dự án" rules={[{ required: true }]}>
          <Input maxLength={32} />
        </Form.Item>
        <Form.Item name="name" label="Tên dự án" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="owner" label="Chủ dự án" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Segmented block options={[...statusOptions]} />
        </Form.Item>
        <Form.Item name="dateRange" label="Thời gian">
          <DatePicker.RangePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="budget" label="Ngân sách (VND)">
          <InputNumber
            className="w-full"
            min={0}
            step={1000000}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v: string | undefined): number =>
              v ? Number(v.replace(/[^\d]/g, "")) : 0
            }
          />
        </Form.Item>
        <Form.Item name="progress" label="Tiến độ (%)">
          <InputNumber className="w-full" min={0} max={100} />
        </Form.Item>
        <Form.Item name="tags" label="Tags">
          <Select mode="tags" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ProjectFormDrawer;
