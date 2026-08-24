import type { UpstreamHealth } from "@tradecheck/contracts";

export interface ProviderConfig {
  name: string;
  baseUrl?: string;
  serviceToken?: string;
  healthPath: string;
  timeoutMs?: number;
}

export class UpstreamProvider {
  constructor(private readonly config: ProviderConfig) {}

  async health(): Promise<UpstreamHealth> {
    if (!this.config.baseUrl) {
      return {
        provider: this.config.name,
        available: false,
        detail: "not_configured",
      };
    }

    try {
      const response = await this.request(this.config.healthPath, { method: "GET" });
      return {
        provider: this.config.name,
        available: response.ok,
        detail: response.ok ? "ok" : `http_${response.status}`,
      };
    } catch (error) {
      return {
        provider: this.config.name,
        available: false,
        detail: error instanceof Error ? error.name : "unknown_error",
      };
    }
  }

  async json<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.config.baseUrl) throw new ProviderNotConfiguredError(this.config.name);
    const response = await this.request(path, init);
    if (!response.ok) {
      throw new ProviderHttpError(this.config.name, response.status);
    }
    return (await response.json()) as T;
  }

  private request(path: string, init: RequestInit): Promise<Response> {
    if (!this.config.baseUrl) throw new ProviderNotConfiguredError(this.config.name);
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    if (this.config.serviceToken) {
      headers.set("authorization", `Bearer ${this.config.serviceToken}`);
    }

    return fetch(new URL(path, this.config.baseUrl), {
      ...init,
      headers,
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 5_000),
    });
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider}_not_configured`);
  }
}

export class ProviderHttpError extends Error {
  constructor(provider: string, public readonly status: number) {
    super(`${provider}_http_${status}`);
  }
}

export function createTradeTallyProvider(config: {
  baseUrl?: string;
  serviceToken?: string;
}): UpstreamProvider {
  return new UpstreamProvider({
    name: "tradetally",
    healthPath: "/api/health",
    ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
    ...(config.serviceToken ? { serviceToken: config.serviceToken } : {}),
  });
}

export function createVibeTradingProvider(config: {
  baseUrl?: string;
  serviceToken?: string;
}): UpstreamProvider {
  return new UpstreamProvider({
    name: "vibe-trading",
    healthPath: "/health",
    timeoutMs: 10_000,
    ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
    ...(config.serviceToken ? { serviceToken: config.serviceToken } : {}),
  });
}
