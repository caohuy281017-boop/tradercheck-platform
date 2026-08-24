import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "TradeCheck — Hiểu rõ hiệu suất giao dịch",
  description: "Nhật ký, phân tích và AI dành cho nhà đầu tư Việt Nam.",
};

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
