import { message } from "antd";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token); // Lưu token vào localStorage
    return data;
  } else {
    throw new Error("Đăng nhập thất bại");
  }
};

export const logout = async () => {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      message.error("Logout không thành công phía server");
    }
    message.success("Đăng xuất thành công");
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu logout:", error);
  } finally {
    localStorage.removeItem("token");
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // Ưu tiên kiểm tra cookie trước, fallback sang localStorage nếu không có
    const token = Cookies.get("token") || localStorage.getItem("token");
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT format");
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;

    if (!exp || typeof exp !== "number") {
      console.warn("Missing or invalid exp in token");
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      console.warn("Token has expired");
      return false;
    }

    // Nếu muốn kiểm tra với server, có thể gọi API xác thực ở đây:
    // const res = await fetch("/api/verify-token", {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // return res.ok;

    return true;
  } catch (error) {
    console.error("Authentication check failed:", error);
    return false;
  }
};
