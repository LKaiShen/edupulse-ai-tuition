import type { Metadata } from "next";
import "./globals.css";
import DemoTour from "@/components/DemoTour";

export const metadata: Metadata = {
  title: "EduPulse AI · SS2 / SS15 补习中心咨询",
  description: "SS2 & SS15 补习中心家长咨询、AI 智能分类与零幻觉 FAQ 回复草稿，人工兜底审核。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="font-sans text-slate-900 antialiased">
        {children}
        <DemoTour />
      </body>
    </html>
  );
}
