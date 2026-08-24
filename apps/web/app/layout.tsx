import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "TradeCheck VN",
  description: "Nền tảng dữ liệu và AI dành cho nhà đầu tư Việt Nam",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
