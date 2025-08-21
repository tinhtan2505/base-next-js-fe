import type { ComponentType, ReactNode } from "react";
import {
  HomeOutlined,
  BankOutlined,
  FolderOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

// Lấy đúng kiểu props của icon Ant Design
type IconProps = React.ComponentProps<typeof HomeOutlined>;
export type IconType = ComponentType<IconProps>;

export type AppMenuItem = {
  key: string;
  label: ReactNode;
  icon?: IconType; // nhận component icon với đúng kiểu props
  children?: AppMenuItem[];
  exact?: boolean;
  hidden?: boolean;
};

export const MENU: AppMenuItem[] = [
  { key: "/", label: "Home", icon: HomeOutlined },
  {
    key: "/payment-listener",
    label: "Payment",
    icon: BankOutlined,
    children: [
      {
        key: "/payment-listener/all",
        label: "Dashboard",
        icon: FileTextOutlined,
        exact: true,
      },
      { key: "/payment-listener/transactions", label: "Transactions" },
      { key: "/payment-listener/settings", label: "Settings" },
    ],
  },
  {
    key: "/project",
    label: "Project",
    icon: FolderOutlined,
    children: [
      { key: "/project/all-project", label: "All Projects", exact: true },
      { key: "/project/new", label: "Create New" },
      {
        key: "/project/templates",
        label: "Templates",
        children: [
          { key: "/project/templates/web", label: "Web" },
          { key: "/project/templates/mobile", label: "Mobile" },
        ],
      },
    ],
  },
];
