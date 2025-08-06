"use client";
import React from "react";
import { Layout, Menu, Button } from "antd";
import { LogoutOutlined, HomeOutlined, ApiOutlined } from "@ant-design/icons";
import { logout } from "./utils/auth";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "1",
    icon: <HomeOutlined />,
    label: "Trang chủ",
  },
  {
    key: "2",
    icon: <ApiOutlined />,
    label: "API Merchant",
  },
];
export default function Home() {
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };
  return (
    <Layout className="h-full">
      {/* Sidebar trái */}
      <Sider breakpoint="lg" collapsedWidth="0" className="bg-white">
        <div className="h-16 text-center font-bold text-lg flex items-center justify-center border-b">
          TTH Menu
        </div>

        {/* ✅ Dùng items thay vì children */}
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={menuItems}
          className="h-full"
        />
      </Sider>

      {/* Main layout */}
      <Layout>
        <Header className="bg-white flex justify-end items-center px-6 shadow-sm">
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </Header>

        {/* Nội dung chính */}
        <Content className="p-8 bg-gray-100">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h1 className="text-2xl font-semibold mb-4">
              Chào mừng bạn đến với{" "}
              <span className="text-blue-600">TTH PAYMENT LISTENER</span>
            </h1>
            <p className="text-gray-700 leading-relaxed">
              Website này dùng để lắng nghe Merchant xây dựng API RESTful, nhằm
              cập nhật trạng thái thanh toán QR VNPAY từ BIDV một cách tự động
              và chính xác.
            </p>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
