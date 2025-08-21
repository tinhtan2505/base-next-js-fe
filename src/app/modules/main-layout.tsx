"use client";
import React from "react";
import { Layout, Menu, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { MenuInfo } from "rc-menu/lib/interface";

import { logout } from "./auth/lib/auth";
import { MENU } from "../config/menu.config";
import { buildAntdItems, findBestMatch } from "../config/menu.utils";

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Sinh items cho antd Menu từ cấu hình gốc
  const menuItems = buildAntdItems(MENU);

  // Tìm item đang active + parents để mở submenu
  const { key: activeKey, parents } = findBestMatch(pathname, MENU);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleMenuClick = (e: MenuInfo) => {
    router.push(e.key);
  };

  return (
    <Layout className="h-full">
      <Sider breakpoint="lg" collapsedWidth="0" className="bg-white">
        <div className="h-16 text-white text-center font-bold text-lg flex items-center justify-center border-b">
          TTH Menu
        </div>

        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={activeKey ? [activeKey] : []}
          defaultOpenKeys={parents}
          className="h-full"
          onClick={handleMenuClick}
        />
      </Sider>

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

        <Content className="bg-gray-100">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
