import type { CapabilityHandler } from "@tradecheck/harness";
import type { UpstreamProvider } from "@tradecheck/providers";

export interface VietnamFeatureFlags {
  tradeAnalytics: boolean;
  vnImport: boolean;
  aiResearch: boolean;
  backtest: boolean;
  hub: boolean;
}

export function createVietnamCapabilities(
  flags: VietnamFeatureFlags,
  providers: { tradeTally: UpstreamProvider; vibeTrading: UpstreamProvider },
): CapabilityHandler[] {
  return [
    {
      manifest: {
        id: "trades.import.vn",
        name: "Nhập sao kê Việt Nam",
        description: "Chuẩn hóa sao kê từ parser chạy trong trình duyệt",
        provider: "tradecheck-vietnam",
        scopes: ["trades.write"],
        plans: ["free", "pro", "business"],
        riskLevel: "medium",
        approvalRequired: true,
        asynchronous: false,
        enabled: flags.vnImport,
      },
      execute: async (input) => ({ accepted: true, input }),
    },
    {
      manifest: {
        id: "analytics.trading-summary",
        name: "Tổng hợp hiệu suất",
        description: "Đọc dữ liệu đã chuẩn hóa qua adapter TradeTally",
        provider: "tradetally-adapter",
        scopes: ["analytics.read"],
        plans: ["free", "pro", "business"],
        riskLevel: "low",
        approvalRequired: false,
        asynchronous: false,
        enabled: flags.tradeAnalytics,
      },
      execute: async () => ({ upstream: await providers.tradeTally.health() }),
    },
    {
      manifest: {
        id: "ai.research-symbol",
        name: "AI nghiên cứu cổ phiếu",
        description: "Tạo job nghiên cứu qua Vibe-Trading hoặc provider AI khác",
        provider: "vibe-trading-adapter",
        scopes: ["ai.research"],
        plans: ["pro", "business"],
        riskLevel: "medium",
        approvalRequired: true,
        asynchronous: true,
        enabled: flags.aiResearch,
      },
      execute: async () => ({ upstream: await providers.vibeTrading.health() }),
    },
    {
      manifest: {
        id: "backtest.run",
        name: "Chạy backtest",
        description: "Đưa chiến lược vào worker cô lập; không có quyền đặt lệnh",
        provider: "vibe-trading-adapter",
        scopes: ["backtest.run"],
        plans: ["pro", "business"],
        riskLevel: "high",
        approvalRequired: true,
        asynchronous: true,
        enabled: flags.backtest,
      },
      execute: async () => ({ upstream: await providers.vibeTrading.health() }),
    },
    {
      manifest: {
        id: "hub.catalog.read",
        name: "Danh mục công cụ",
        description: "Đọc registry công cụ đã được quản trị phê duyệt",
        provider: "tradecheck-hub",
        scopes: [],
        plans: ["free", "pro", "business"],
        riskLevel: "low",
        approvalRequired: false,
        asynchronous: false,
        enabled: flags.hub,
      },
      execute: async () => ({ tools: [] }),
    },
  ];
}
