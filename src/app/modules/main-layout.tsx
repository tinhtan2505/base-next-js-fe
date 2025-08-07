'use client';
import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { LogoutOutlined, HomeOutlined, BankOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { MenuInfo } from 'rc-menu/lib/interface';
import { logout } from './auth/lib/auth';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: 'Home',
  },
  {
    key: '/payment-listener',
    icon: <BankOutlined />,
    label: 'Payment Listener',
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
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
          selectedKeys={[pathname]}
          items={menuItems}
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
