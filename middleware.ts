// middleware.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const url = request.nextUrl.clone();

  // Nếu không có token và không phải trang login, chuyển hướng đến /login
  if (!token && url.pathname !== "/login") {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Nếu đã đăng nhập và truy cập /login, chuyển hướng về trang chủ
  if (token && url.pathname === "/login") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Áp dụng middleware cho tất cả các route trừ API, static files, v.v.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
