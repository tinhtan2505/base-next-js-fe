const domain = "http://localhost:8080/";

export const login = async (username: string, password: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const requestOptions: RequestInit = {
    method: "POST",
    headers: new Headers(headers),
    body: JSON.stringify({ username: username, password: password }),
  };

  const response = await fetch(domain + "api/auth/login", requestOptions);
  const statusCode = response.status;
  const data = await response.json();

  if (statusCode === 200) {
    localStorage.setItem("token", data.token);
    return data;
  } else {
    throw new Error("Đăng nhập thất bại");
  }
};
