"use client";
import { Button, DatePicker, Input, Select, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { ProjectStatus } from "../libs/types";

interface Props {
  q: string;
  onQChange: (v: string) => void;
  status: ProjectStatus | "all";
  onStatusChange: (v: ProjectStatus | "all") => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (v: [Dayjs | null, Dayjs | null] | null) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onCreate: () => void;
}

export const FiltersBar: React.FC<Props> = ({
  q,
  onQChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  selectedCount,
  onBulkDelete,
  onExport,
  onRefresh,
  onCreate,
}) => (
  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
    <div className="flex-1">
      <Input.Search
        allowClear
        placeholder="Tìm theo tên, mã, chủ dự án, mô tả, tag"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        onSearch={onQChange}
      />
    </div>
    <Select
      className="min-w-[180px]"
      value={status}
      onChange={onStatusChange}
      options={[
        { value: "all", label: "Tất cả trạng thái" },
        { value: "planning", label: "Planning" },
        { value: "active", label: "Active" },
        { value: "paused", label: "Paused" },
        { value: "done", label: "Done" },
      ]}
    />
    <DatePicker.RangePicker
      value={dateRange ?? [null, null]}
      onChange={onDateRangeChange}
      placeholder={["Bắt đầu", "Kết thúc"]}
    />
    {selectedCount > 0 && (
      <Space>
        <Button danger icon={<DeleteOutlined />} onClick={onBulkDelete}>
          Xóa đã chọn ({selectedCount})
        </Button>
      </Space>
    )}
  </div>
);
