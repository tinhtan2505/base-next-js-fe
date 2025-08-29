"use client";
import React, { useMemo } from "react";
import { Button, Empty, Popconfirm, Space, Table, Tag, Tooltip } from "antd";
import { ColumnsType, TableProps } from "antd/es/table";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Project,
  ProjectStatus,
  ProjectStatusEnum,
  STATUS_META,
} from "../libs/types";

interface Props {
  data: Project[];
  loading: boolean;
  selectedRowKeys: React.Key[];
  onRowKeysChange: (keys: React.Key[]) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

export const ProjectTable: React.FC<Props> = ({
  data,
  loading,
  selectedRowKeys,
  onRowKeysChange,
  onEdit,
  onDelete,
}) => {
  const columns = useMemo<ColumnsType<Project>>(
    () => [
      {
        title: "Mã",
        dataIndex: "code",
        sorter: (a, b) => a.code.localeCompare(b.code),
      },
      {
        title: "Tên dự án",
        dataIndex: "name",
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <span className="font-medium">{r.name}</span>
            <span className="text-xs text-gray-500">{r.description}</span>
          </Space>
        ),
      },
      {
        title: "Chủ dự án",
        dataIndex: "owner",
        sorter: (a, b) => a.owner.localeCompare(b.owner),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        render: (v: ProjectStatus) => {
          const STR2ENUM: Record<string, ProjectStatusEnum> = {
            planning: ProjectStatusEnum.PLANNING,
            active: ProjectStatusEnum.ACTIVE,
            paused: ProjectStatusEnum.PAUSED,
            done: ProjectStatusEnum.DONE,
          };

          const key =
            typeof v === "number"
              ? v
              : STR2ENUM[String(v).toLowerCase()] ?? ProjectStatusEnum.PLANNING;

          const meta = STATUS_META[key];
          return <Tag color={meta?.color}>{meta?.label}</Tag>;
        },
      },
      {
        title: "Bắt đầu",
        dataIndex: "startDate",
        render: (v: string) => dayjs(v).format("YYYY-MM-DD"),
      },
      {
        title: "Kết thúc",
        dataIndex: "dueDate",
        render: (v?: string) => (v ? dayjs(v).format("YYYY-MM-DD") : "—"),
      },
      {
        title: "Ngân sách",
        dataIndex: "budget",
        align: "right",
        render: (v?: number) => (v ? v.toLocaleString("vi-VN") : "—"),
      },
      {
        title: "Tiến độ",
        dataIndex: "progress",
        align: "right",
        render: (v?: number) => (v ?? 0) + "%",
      },
      {
        title: "Hành động",
        render: (_, r) => (
          <Space>
            <Tooltip title="Sửa">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(r)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa dự án"
                okButtonProps={{ danger: true }}
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete(r.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const rowSelection: TableProps<Project>["rowSelection"] = {
    selectedRowKeys,
    onChange: onRowKeysChange,
  };

  return (
    <Table<Project>
      rowKey="id"
      size="middle"
      loading={loading}
      dataSource={data}
      columns={columns}
      rowSelection={rowSelection}
      pagination={{ pageSize: 8, showSizeChanger: true }}
      locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
    />
  );
};
