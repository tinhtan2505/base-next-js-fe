"use client";
import { Button, Checkbox, Form, Input, message } from "antd";
import React from "react";
import { login } from "../lib/api-service";
import { isAuthenticated } from "../utils/auth";
import { useRouter } from "next/navigation";

const Login: React.FC<object> = ({}) => {
  const router = useRouter();

  interface LoginFormValues {
    username: string;
    password: string;
    remember?: boolean;
  }

  const onFinish = async (values: LoginFormValues) => {
    await login(values.username, values.password);
    if (isAuthenticated()) {
      message.success("Đăng nhập thành công!");
      router.push("/"); // <-- chuyển hướng
    } else {
      message.error("Đăng nhập thất bại!");
    }
  };

  // const onFinishFailed = (errorInfo: any) => {
  //   console.log("Failed:", errorInfo);
  // };
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold">Welcome back!</h2>
        <h3 className="text-lg mb-6">Log in to TTH Payment Listener</h3>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          //   onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            label="UserName"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Type your username address" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Type your password" />
          </Form.Item>

          <div className="flex justify-between items-center mb-3">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <a className="text-red-500" href="">
              Forgot password?
            </a>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Log in
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <span>Do not have an account? </span>
          <a className="text-red-500" href="">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
