"use client";
import React from "react";
import MainLayout from "../../main-layout";

const Home: React.FC = () => {
  return (
    <div className="bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">
        Chào mừng bạn đến với{" "}
        <span className="text-blue-600">TTH PAYMENT LISTENER</span>
      </h1>
      <p className="text-gray-700 leading-relaxed">
        Website này dùng để lắng nghe Merchant xây dựng API RESTful, nhằm cập
        nhật trạng thái thanh toán QR VNPAY từ BIDV một cách tự động và chính
        xác.
      </p>
    </div>
  );
};

export default Home;
