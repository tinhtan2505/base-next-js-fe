"use client";
import { Card } from "antd";

interface Props {
  stats: { total: number; active: number; done: number; avgProgress: number };
}

export const StatsCards: React.FC<Props> = ({ stats }) => (
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
);
