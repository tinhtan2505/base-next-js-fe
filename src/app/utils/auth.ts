import { message } from "antd";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
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

export const isAuthenticated = (): boolean => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    return !!token; // Trả về true nếu token tồn tại
  }
  return false;
};
