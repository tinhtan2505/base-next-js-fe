import "@ant-design/v5-patch-for-react-19";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import LayoutClient from "./layout-client";
import AntdReact19Patch from "../AntdReact19Patch";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TTH PAYMENT LISTENER",
  description: "TTH PAYMENT LISTENER",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black invisible`}
        cz-shortcut-listen="true"
      >
        <AntdReact19Patch />
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
