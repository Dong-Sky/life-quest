import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "Questline",
  description: "A calm, gamified personal operating system.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
