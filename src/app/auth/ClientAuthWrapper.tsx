// components/ClientAuthWrapper.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "../utils/auth";

export default function ClientAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = isAuthenticated();

  useEffect(() => {
    if (!isAuth && pathname !== "/login") {
      router.push("/login");
    }
    if (isAuth && pathname === "/login") {
      router.push("/");
    }
  }, [isAuth, pathname, router]);

  return <>{children}</>;
}
