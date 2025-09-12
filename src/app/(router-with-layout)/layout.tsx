import "@ant-design/v5-patch-for-react-19";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import LayoutClient from "./layout-client";
import AntdReact19Patch from "../AntdReact19Patch";
import ReduxProvider from "../store/ReduxProvider";
import RealtimeProvider from "../lib/realtime/RealtimeProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WEB NQT",
  description: "WEB NQT",
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
        <ReduxProvider>
          <RealtimeProvider>
            <AntdReact19Patch />
            <LayoutClient>{children}</LayoutClient>
          </RealtimeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
