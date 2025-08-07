"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "./lib/auth";

export default function ClientAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await isAuthenticated();
      setIsAuth(result);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuth === null) return;

    if (!isAuth && pathname !== "/login") {
      router.push("/login");
    } else if (isAuth && pathname === "/login") {
      router.push("/");
    }
  }, [isAuth, pathname, router]);

  return <>{children}</>;
}
