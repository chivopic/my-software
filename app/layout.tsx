import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal Workbench",
  description: "笔记、任务、计划与信息流的个人工作台",
};

// 在首屏绘制前套用已保存的主题，避免深色模式下闪一下白屏。
// beforeInteractive + 放在 root layout 是官方写法（next/dist/docs/.../script.md）。
// 开发模式下访问 notFound() 页面时 React 会警告 "Encountered a script tag"，
// 这是 dev 专属诊断，生产构建里没有，脚本本身照常在 hydration 前执行。
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={inter.variable} suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
