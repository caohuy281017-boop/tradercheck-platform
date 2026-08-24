import type {
  Actor,
  CapabilityManifest,
  ToolRequest,
  ToolResult,
} from "@tradecheck/contracts";

export interface CapabilityContext {
  actor: Actor;
  runId: string;
  signal?: AbortSignal;
}

export interface CapabilityHandler {
  manifest: CapabilityManifest;
  execute(input: unknown, context: CapabilityContext): Promise<unknown>;
}

export interface RunLedger {
  append(event: RunEvent): Promise<void>;
}

export interface RunEvent {
  runId: string;
  userId: string;
  capabilityId: string;
  type: "requested" | "approval_required" | "started" | "completed" | "failed";
  occurredAt: string;
  detail?: Record<string, unknown>;
}

export class CapabilityRegistry {
  readonly #handlers = new Map<string, CapabilityHandler>();

  register(handler: CapabilityHandler): void {
    if (this.#handlers.has(handler.manifest.id)) {
      throw new Error(`Capability already registered: ${handler.manifest.id}`);
    }
    this.#handlers.set(handler.manifest.id, handler);
  }

  get(id: string): CapabilityHandler | undefined {
    return this.#handlers.get(id);
  }

  list(): CapabilityManifest[] {
    return [...this.#handlers.values()].map(({ manifest }) => manifest);
  }
}

export class PolicyEngine {
  evaluate(actor: Actor, manifest: CapabilityManifest, approved: boolean): void {
    if (!manifest.enabled) throw new PolicyError("capability_disabled");
    if (!manifest.plans.includes(actor.plan)) throw new PolicyError("plan_not_allowed");

    const missingScopes = manifest.scopes.filter((scope) => !actor.scopes.includes(scope));
    if (missingScopes.length > 0) {
      throw new PolicyError("missing_scope", { missingScopes });
    }
    if (manifest.approvalRequired && !approved) {
      throw new ApprovalRequiredError();
    }
  }
}

export class PolicyError extends Error {
  constructor(
    public readonly code: string,
    public readonly detail: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

export class ApprovalRequiredError extends PolicyError {
  constructor() {
    super("approval_required");
  }
}

export class InMemoryRunLedger implements RunLedger {
  readonly events: RunEvent[] = [];

  async append(event: RunEvent): Promise<void> {
    this.events.push(structuredClone(event));
  }
}

export class HarnessRunner {
  constructor(
    private readonly registry: CapabilityRegistry,
    private readonly policy: PolicyEngine,
    private readonly ledger: RunLedger,
    private readonly createRunId: () => string = () => crypto.randomUUID(),
  ) {}

  async run(actor: Actor, request: ToolRequest): Promise<ToolResult> {
    const runId = this.createRunId();
    const handler = this.registry.get(request.capabilityId);
    if (!handler) {
      return { runId, status: "rejected", message: "capability_not_found" };
    }

    await this.record(runId, actor.userId, request.capabilityId, "requested");

    try {
      this.policy.evaluate(actor, handler.manifest, request.approved);
    } catch (error) {
      if (error instanceof ApprovalRequiredError) {
        await this.record(runId, actor.userId, request.capabilityId, "approval_required");
        return { runId, status: "approval_required", message: error.code };
      }
      if (error instanceof PolicyError) {
        return { runId, status: "rejected", message: error.code };
      }
      throw error;
    }

    if (handler.manifest.asynchronous) {
      return { runId, status: "queued", message: "job_queue_adapter_required" };
    }

    await this.record(runId, actor.userId, request.capabilityId, "started");
    try {
      const output = await handler.execute(request.input, { actor, runId });
      await this.record(runId, actor.userId, request.capabilityId, "completed");
      return { runId, status: "completed", output };
    } catch (error) {
      await this.record(runId, actor.userId, request.capabilityId, "failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      throw error;
    }
  }

  private record(
    runId: string,
    userId: string,
    capabilityId: string,
    type: RunEvent["type"],
    detail?: Record<string, unknown>,
  ): Promise<void> {
    return this.ledger.append({
      runId,
      userId,
      capabilityId,
      type,
      occurredAt: new Date().toISOString(),
      ...(detail ? { detail } : {}),
    });
  }
}
