"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ClientAuthWrapper from "../modules/auth/ClientAuthWrapper";
import MainLayout from "../modules/main-layout";
import { Skeleton } from "antd";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    setIsLoadingContent(true);
    const timeout = setTimeout(() => setIsLoadingContent(false), 400); // giả lập loading
    return () => clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.remove("invisible");
  }, []);

  return (
    <MainLayout>
      <ClientAuthWrapper>
        {isLoadingContent ? (
          <div className="p-6">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : (
          children
        )}
      </ClientAuthWrapper>
    </MainLayout>
  );
}
