import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./styles.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TradeCheck — Hiểu rõ hiệu suất giao dịch chứng khoán Việt Nam",
  description:
    "Chuẩn hóa sao kê VNDIRECT, SSI, VPS, TCBS. Tách biệt phí 0.15%, thuế 0.1%. Phát hiện điểm mù tâm lý với AI Habit Coach. Bảo mật tuyệt đối.",
  keywords: ["chứng khoán", "tradecheck", "sao kê", "phân tích trading", "AI coach"],
};

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${jetBrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
