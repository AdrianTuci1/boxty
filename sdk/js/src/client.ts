/**
 * Thin HTTP client wrapping native `fetch`.  Discovers the Boxty
 * gateway URL from the `BOXTY_GATEWAY_URL` environment variable.
 *
 * No external dependencies required.
 */

import type {
  CliState,
  SecretInfo,
  VolumeInfo,
  VolumeEntry,
  DatabaseInfo,
  DatabaseItem,
  DatabaseQueryParams,
  CreateSecretPayload,
  CreateVolumePayload,
  CreateDatabasePayload,
  PutEntryPayload,
  PutItemPayload,
  WorkloadInfo,
  WorkspaceInfo,
  EnvironmentInfo,
  RouteInfo,
  ScheduleInfo,
  ImageInfo,
  BillingBalance,
  BillingUsage,
  DashboardSummary,
  ApiKeyInfo,
  InviteInfo,
  ProviderInfo,
} from "./types.js";

function baseUrl(gateway?: string): string {
  const url =
    gateway ??
    (typeof process !== "undefined" ? process.env?.BOXTY_GATEWAY_URL : undefined) ??
    "http://127.0.0.1:8080";
  return url.replace(/\/+$/, "");
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Boxty API error ${res.status} ${res.statusText}: ${body}`,
    );
  }
  return res.json() as Promise<T>;
}

export class BoxtyClient {
  private base: string;

  constructor(gatewayUrl?: string) {
    this.base = baseUrl(gatewayUrl);
  }

  // -- helpers ---------------------------------------------------------------

  private url(path: string): string {
    return `${this.base}${path}`;
  }

  private params(q: Record<string, string>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v) usp.set(k, v);
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
  }

  // -- state -----------------------------------------------------------------

  async state(): Promise<CliState> {
    return request<CliState>(this.url("/api/cli/state"));
  }

  // -- secrets ---------------------------------------------------------------

  async listSecrets(): Promise<SecretInfo[]> {
    return request<SecretInfo[]>(this.url("/api/secrets"));
  }

  async createSecret(
    name: string,
    envVars: Record<string, string>,
  ): Promise<SecretInfo> {
    const payload: CreateSecretPayload = {
      name,
      envVars: Object.entries(envVars).map(([key, value]) => ({
        key,
        value,
      })),
    };
    return request<SecretInfo>(this.url("/api/secrets"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async deleteSecret(locator: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(`/api/secrets/${encodeURIComponent(locator)}`),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- volumes ---------------------------------------------------------------

  async listVolumes(): Promise<VolumeInfo[]> {
    return request<VolumeInfo[]>(this.url("/api/volumes"));
  }

  async createVolume(
    name: string,
    sizeGb = 10,
    type = "block-storage",
  ): Promise<VolumeInfo> {
    const payload: CreateVolumePayload = { name, sizeGb, type };
    return request<VolumeInfo>(this.url("/api/volumes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async deleteVolume(locator: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(`/api/volumes/${encodeURIComponent(locator)}`),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- volume entries --------------------------------------------------------

  async listVolumeEntries(
    locator: string,
    path = "",
  ): Promise<VolumeEntry[]> {
    const q = path ? this.params({ path }) : "";
    return request<VolumeEntry[]>(
      this.url(`/api/volumes/${encodeURIComponent(locator)}/entries${q}`),
    );
  }

  async putVolumeEntry(
    locator: string,
    path: string,
    contents: string,
  ): Promise<VolumeEntry> {
    const payload: PutEntryPayload = { path, contents };
    return request<VolumeEntry>(
      this.url(`/api/volumes/${encodeURIComponent(locator)}/entries`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }

  async deleteVolumeEntry(
    locator: string,
    path: string,
  ): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(
        `/api/volumes/${encodeURIComponent(locator)}/entries${this.params({ path })}`,
      ),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- volume blob -----------------------------------------------------------

  async putVolumeBlob(
    locator: string,
    path: string,
    data: Uint8Array,
  ): Promise<VolumeEntry> {
    return request<VolumeEntry>(
      this.url(
        `/api/volumes/${encodeURIComponent(locator)}/blob${this.params({ path })}`,
      ),
      {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: data as unknown as BodyInit,
      },
    );
  }

  // -- public object URL -----------------------------------------------------

  objectUrl(locator: string, path: string): string {
    return `${this.base}/objects/${locator}/${path.replace(/^\//, "")}`;
  }

  // -- databases -------------------------------------------------------------

  async listDatabases(): Promise<DatabaseInfo[]> {
    return request<DatabaseInfo[]>(this.url("/api/databases"));
  }

  async createDatabase(
    name: string,
    pkName: string,
    skName = "",
    gsiName = "",
    gsiPkName = "",
    gsiSkName = "",
  ): Promise<DatabaseInfo> {
    const payload: CreateDatabasePayload = {
      name,
      pkName,
      skName,
      gsiName,
      gsiPkName,
      gsiSkName,
    };
    return request<DatabaseInfo>(this.url("/api/databases"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async deleteDatabase(locator: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(`/api/databases/${encodeURIComponent(locator)}`),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- database items --------------------------------------------------------

  async listDatabaseItems(locator: string): Promise<DatabaseItem[]> {
    return request<DatabaseItem[]>(
      this.url(`/api/databases/${encodeURIComponent(locator)}/items`),
    );
  }

  async putDatabaseItem(
    locator: string,
    value: Record<string, unknown>,
  ): Promise<DatabaseItem> {
    const payload: PutItemPayload = { value };
    return request<DatabaseItem>(
      this.url(`/api/databases/${encodeURIComponent(locator)}/items`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }

  async deleteDatabaseItem(
    locator: string,
    pk: string,
    sk = "",
  ): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(
        `/api/databases/${encodeURIComponent(locator)}/items${this.params({ pk, sk })}`,
      ),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- database query --------------------------------------------------------

  async queryDatabase(
    locator: string,
    params: DatabaseQueryParams,
  ): Promise<DatabaseItem[]> {
    return request<DatabaseItem[]>(
      this.url(`/api/databases/${encodeURIComponent(locator)}/query`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
    );
  }

  // -- auth ------------------------------------------------------------------

  async signup(externalUserId: string, email?: string, organizationId?: string): Promise<{ user_id: string; access_token: string }> {
    return request<{ user_id: string; access_token: string }>(this.url("/v1/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ external_user_id: externalUserId, email, organization_id: organizationId }),
    });
  }

  async login(externalUserId: string, email?: string): Promise<{ user_id: string; access_token: string }> {
    return request<{ user_id: string; access_token: string }>(this.url("/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ external_user_id: externalUserId, email }),
    });
  }

  // -- workspaces ------------------------------------------------------------

  async listWorkspaces(ownerId?: string): Promise<WorkspaceInfo[]> {
    const q = ownerId ? this.params({ owner_id: ownerId }) : "";
    return request<WorkspaceInfo[]>(this.url(`/v1/workspaces${q}`));
  }

  async createWorkspace(ownerId: string, name: string): Promise<WorkspaceInfo> {
    return request<WorkspaceInfo>(this.url("/v1/workspaces"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: ownerId, name }),
    });
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceInfo> {
    return request<WorkspaceInfo>(this.url(`/v1/workspaces/${encodeURIComponent(workspaceId)}`));
  }

  async deleteWorkspace(workspaceId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/workspaces/${encodeURIComponent(workspaceId)}`), {
      method: "DELETE",
    });
  }

  // -- environments ----------------------------------------------------------

  async listEnvironments(workspaceId: string): Promise<EnvironmentInfo[]> {
    return request<EnvironmentInfo[]>(this.url(`/v1/workspaces/${encodeURIComponent(workspaceId)}/environments`));
  }

  async createEnvironment(workspaceId: string, name: string): Promise<EnvironmentInfo> {
    return request<EnvironmentInfo>(this.url("/v1/environments"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, name }),
    });
  }

  async getEnvironment(environmentId: string): Promise<EnvironmentInfo> {
    return request<EnvironmentInfo>(this.url(`/v1/environments/${encodeURIComponent(environmentId)}`));
  }

  async deleteEnvironment(environmentId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/environments/${encodeURIComponent(environmentId)}`), {
      method: "DELETE",
    });
  }

  // -- workloads / apps ------------------------------------------------------

  async listWorkloads(workspaceId?: string, environmentId?: string): Promise<WorkloadInfo[]> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspace_id = workspaceId;
    if (environmentId) params.environment_id = environmentId;
    const q = Object.keys(params).length > 0 ? this.params(params) : "";
    return request<WorkloadInfo[]>(this.url(`/v1/workloads${q}`));
  }

  async createWorkload(payload: {
    owner_id: string;
    workspace_id: string;
    environment_id: string;
    kind: string;
    image: string;
    command?: string[];
    region?: string;
    pool?: string;
    endpoint_name?: string;
    requested_backend?: string;
    cpu_cores?: number;
    memory_mb?: number;
    disk_gb?: number;
    gpu_count?: number;
    gpu_type?: string;
  }): Promise<WorkloadInfo> {
    return request<WorkloadInfo>(this.url("/v1/workloads"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async getWorkload(workloadId: string): Promise<WorkloadInfo> {
    return request<WorkloadInfo>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}`));
  }

  async deleteWorkload(workloadId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}`), {
      method: "DELETE",
    });
  }

  async updateWorkloadStatus(workloadId: string, status: string): Promise<WorkloadInfo> {
    return request<WorkloadInfo>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async getWorkloadMetrics(workloadId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/metrics`));
  }

  async getWorkloadLogs(workloadId: string): Promise<{ timestamp: string; message: string }[]> {
    return request<{ timestamp: string; message: string }[]>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/logs`));
  }

  // -- routes ----------------------------------------------------------------

  async listRoutes(workspaceId?: string, environmentId?: string): Promise<RouteInfo[]> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspace_id = workspaceId;
    if (environmentId) params.environment_id = environmentId;
    const q = Object.keys(params).length > 0 ? this.params(params) : "";
    return request<RouteInfo[]>(this.url(`/v1/routes${q}`));
  }

  async createRoute(workloadId: string, endpointName: string): Promise<RouteInfo> {
    return request<RouteInfo>(this.url("/v1/routes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workload_id: workloadId, endpoint_name: endpointName }),
    });
  }

  async deleteRoute(routeId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/routes/${encodeURIComponent(routeId)}`), {
      method: "DELETE",
    });
  }

  // -- schedules -------------------------------------------------------------

  async listSchedules(workspaceId?: string): Promise<ScheduleInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<ScheduleInfo[]>(this.url(`/v1/schedules${q}`));
  }

  async createSchedule(payload: {
    name: string;
    schedule_type: string;
    schedule_value: string;
    function_name: string;
    workspace_id: string;
    environment_id: string;
    image?: string;
    cpu?: string;
    memory?: string;
    gpu?: string;
  }): Promise<ScheduleInfo> {
    return request<ScheduleInfo>(this.url("/v1/schedules"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async updateSchedule(scheduleId: string, updates: Partial<ScheduleInfo>): Promise<ScheduleInfo> {
    return request<ScheduleInfo>(this.url(`/v1/schedules/${encodeURIComponent(scheduleId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async deleteSchedule(scheduleId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/schedules/${encodeURIComponent(scheduleId)}`), {
      method: "DELETE",
    });
  }

  async triggerSchedule(scheduleId: string): Promise<{ triggered: boolean }> {
    return request<{ triggered: boolean }>(this.url(`/v1/schedules/${encodeURIComponent(scheduleId)}/trigger`), {
      method: "POST",
    });
  }

  // -- images ----------------------------------------------------------------

  async listImages(): Promise<ImageInfo[]> {
    return request<ImageInfo[]>(this.url("/v1/images"));
  }

  async buildImage(name: string, dockerfile?: string, baseImage?: string): Promise<ImageInfo> {
    return request<ImageInfo>(this.url("/v1/images/build"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, dockerfile, base_image: baseImage }),
    });
  }

  async getImage(imageId: string): Promise<ImageInfo> {
    return request<ImageInfo>(this.url(`/v1/images/${encodeURIComponent(imageId)}`));
  }

  // -- billing ---------------------------------------------------------------

  async getBalance(userId: string): Promise<BillingBalance> {
    return request<BillingBalance>(this.url(`/v1/billing/balance?user_id=${encodeURIComponent(userId)}`));
  }

  async getUsage(userId: string): Promise<BillingUsage> {
    return request<BillingUsage>(this.url(`/v1/billing/usage?user_id=${encodeURIComponent(userId)}`));
  }

  async addCredits(userId: string, amountUsd: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(this.url("/v1/billing/credits"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount_usd: amountUsd }),
    });
  }

  async getPricing(): Promise<Record<string, number>> {
    return request<Record<string, number>>(this.url("/v1/pricing"));
  }

  // -- dashboard -------------------------------------------------------------

  async getDashboard(workspaceId: string, environmentId: string): Promise<DashboardSummary> {
    return request<DashboardSummary>(this.url(`/v1/dashboard/${encodeURIComponent(workspaceId)}/${encodeURIComponent(environmentId)}`));
  }

  async getDashboardSummary(workspaceId: string, environmentId: string): Promise<DashboardSummary> {
    return request<DashboardSummary>(this.url(`/v1/dashboard/${encodeURIComponent(workspaceId)}/${encodeURIComponent(environmentId)}/summary`));
  }

  // -- api keys --------------------------------------------------------------

  async listApiKeys(workspaceId?: string): Promise<ApiKeyInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<ApiKeyInfo[]>(this.url(`/v1/api-keys${q}`));
  }

  async createApiKey(ownerId: string, workspaceId: string, environmentId: string, name: string): Promise<ApiKeyInfo> {
    return request<ApiKeyInfo>(this.url("/v1/api-keys"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: ownerId, workspace_id: workspaceId, environment_id: environmentId, name }),
    });
  }

  async deleteApiKey(apiKeyId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/api-keys/${encodeURIComponent(apiKeyId)}`), {
      method: "DELETE",
    });
  }

  // -- invites ---------------------------------------------------------------

  async listInvites(workspaceId?: string): Promise<InviteInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<InviteInfo[]>(this.url(`/v1/invites${q}`));
  }

  async createInvite(workspaceId: string, email: string, role = "viewer"): Promise<InviteInfo> {
    return request<InviteInfo>(this.url("/v1/invites"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, email, role }),
    });
  }

  async acceptInvite(token: string): Promise<{ accepted: boolean }> {
    return request<{ accepted: boolean }>(this.url("/v1/invites/accept"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  }

  // -- providers -------------------------------------------------------------

  async listProviders(): Promise<ProviderInfo[]> {
    return request<ProviderInfo[]>(this.url("/v1/providers"));
  }

  async registerProvider(name: string, region: string, pool: string, totalSlots: number): Promise<ProviderInfo> {
    return request<ProviderInfo>(this.url("/v1/providers/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, region, pool, total_slots: totalSlots }),
    });
  }

  async deleteProvider(providerId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/providers/${encodeURIComponent(providerId)}`), {
      method: "DELETE",
    });
  }
}
