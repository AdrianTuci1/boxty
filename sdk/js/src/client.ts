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
  PaymentInfo,
  BillingHistoryEntry,
  SandboxSessionInfo,
  UsageRecordInfo,
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

  private params(q: Record<string, string | number | undefined>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
  }

  // -- state -----------------------------------------------------------------

  async state(): Promise<CliState> {
    return request<CliState>(this.url("/api/cli/state"));
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

  async whoami(token?: string): Promise<{ user_id: string; external_user_id: string; email: string | null }> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return request<{ user_id: string; external_user_id: string; email: string | null }>(this.url("/v1/auth/me"), { headers });
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

  async updateWorkspace(workspaceId: string, updates: Partial<WorkspaceInfo>): Promise<WorkspaceInfo> {
    return request<WorkspaceInfo>(this.url(`/v1/workspaces/${encodeURIComponent(workspaceId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
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

  async updateEnvironment(environmentId: string, updates: Partial<EnvironmentInfo>): Promise<EnvironmentInfo> {
    return request<EnvironmentInfo>(this.url(`/v1/environments/${encodeURIComponent(environmentId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async deleteEnvironment(environmentId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/environments/${encodeURIComponent(environmentId)}`), {
      method: "DELETE",
    });
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

  async getApiKey(apiKeyId: string): Promise<ApiKeyInfo> {
    return request<ApiKeyInfo>(this.url(`/v1/api-keys/${encodeURIComponent(apiKeyId)}`));
  }

  async updateApiKey(apiKeyId: string, updates: Partial<ApiKeyInfo>): Promise<ApiKeyInfo> {
    return request<ApiKeyInfo>(this.url(`/v1/api-keys/${encodeURIComponent(apiKeyId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async deleteApiKey(apiKeyId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/api-keys/${encodeURIComponent(apiKeyId)}`), {
      method: "DELETE",
    });
  }

  // -- secrets ---------------------------------------------------------------

  async listSecrets(workspaceId?: string): Promise<SecretInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<SecretInfo[]>(this.url(`/v1/secrets${q}`));
  }

  async createSecret(workspaceId: string, name: string, envVars: Record<string, string>): Promise<SecretInfo> {
    return request<SecretInfo>(this.url("/v1/secrets"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, name, env_vars: envVars }),
    });
  }

  async getSecret(workspaceId: string, secretName: string): Promise<SecretInfo> {
    return request<SecretInfo>(this.url(`/v1/secrets/${encodeURIComponent(workspaceId)}/${encodeURIComponent(secretName)}`));
  }

  async updateSecret(workspaceId: string, secretName: string, envVars: Record<string, string>): Promise<SecretInfo> {
    return request<SecretInfo>(this.url(`/v1/secrets/${encodeURIComponent(workspaceId)}/${encodeURIComponent(secretName)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ env_vars: envVars }),
    });
  }

  async deleteSecret(workspaceId: string, secretName: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/secrets/${encodeURIComponent(workspaceId)}/${encodeURIComponent(secretName)}`), {
      method: "DELETE",
    });
  }

  // -- volumes ---------------------------------------------------------------

  async listVolumes(workspaceId?: string): Promise<VolumeInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<VolumeInfo[]>(this.url(`/v1/volumes${q}`));
  }

  async createVolume(workspaceId: string, name: string, sizeGb = 10, type = "object-storage"): Promise<VolumeInfo> {
    return request<VolumeInfo>(this.url("/v1/volumes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, name, size_gb: sizeGb, volume_type: type }),
    });
  }

  async getVolume(workspaceId: string, locator: string): Promise<VolumeInfo> {
    return request<VolumeInfo>(this.url(`/v1/volumes/${encodeURIComponent(workspaceId)}/${encodeURIComponent(locator)}`));
  }

  async deleteVolume(workspaceId: string, locator: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(this.url(`/v1/volumes/${encodeURIComponent(workspaceId)}/${encodeURIComponent(locator)}`), {
      method: "DELETE",
    });
    return res.deleted;
  }

  // -- volume entries --------------------------------------------------------

  async listVolumeEntries(locator: string, path = ""): Promise<VolumeEntry[]> {
    const q = path ? this.params({ path }) : "";
    return request<VolumeEntry[]>(
      this.url(`/v1/volumes/${encodeURIComponent(locator)}/entries${q}`),
    );
  }

  async putVolumeEntry(locator: string, path: string, contents: string): Promise<VolumeEntry> {
    const payload: PutEntryPayload = { path, contents };
    return request<VolumeEntry>(
      this.url(`/v1/volumes/${encodeURIComponent(locator)}/entries`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }

  async deleteVolumeEntry(locator: string, path: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(
        `/v1/volumes/${encodeURIComponent(locator)}/entries${this.params({ path })}`,
      ),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- volume blob -----------------------------------------------------------

  async putVolumeBlob(locator: string, path: string, data: Uint8Array): Promise<VolumeEntry> {
    return request<VolumeEntry>(
      this.url(
        `/v1/volumes/${encodeURIComponent(locator)}/blob${this.params({ path })}`,
      ),
      {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: data as unknown as BodyInit,
      },
    );
  }

  async getVolumeBlob(locator: string, path: string): Promise<ArrayBuffer> {
    const res = await fetch(this.url(`/v1/volumes/${encodeURIComponent(locator)}/blob${this.params({ path })}`));
    if (!res.ok) throw new Error(`Boxty API error ${res.status}`);
    return res.arrayBuffer();
  }

  // -- public object URL -----------------------------------------------------

  objectUrl(locator: string, path: string): string {
    return `${this.base}/objects/${locator}/${path.replace(/^\//, "")}`;
  }

  // -- databases -------------------------------------------------------------

  async listDatabases(workspaceId?: string): Promise<DatabaseInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<DatabaseInfo[]>(this.url(`/v1/databases${q}`));
  }

  async createDatabase(workspaceId: string, name: string, pkName: string, skName = "", gsiName = "", gsiPkName = "", gsiSkName = ""): Promise<DatabaseInfo> {
    const payload: CreateDatabasePayload = {
      workspace_id: workspaceId,
      name,
      pkName,
      skName,
      gsiName,
      gsiPkName,
      gsiSkName,
    };
    return request<DatabaseInfo>(this.url("/v1/databases"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async getDatabase(locator: string): Promise<DatabaseInfo> {
    return request<DatabaseInfo>(this.url(`/v1/databases/${encodeURIComponent(locator)}`));
  }

  async deleteDatabase(locator: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(`/v1/databases/${encodeURIComponent(locator)}`),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- database items --------------------------------------------------------

  async listDatabaseItems(locator: string): Promise<DatabaseItem[]> {
    return request<DatabaseItem[]>(
      this.url(`/v1/databases/${encodeURIComponent(locator)}/items`),
    );
  }

  async getDatabaseItem(locator: string, pk: string, sk = ""): Promise<DatabaseItem> {
    return request<DatabaseItem>(
      this.url(`/v1/databases/${encodeURIComponent(locator)}/items${this.params({ pk, sk })}`),
    );
  }

  async putDatabaseItem(locator: string, value: Record<string, unknown>): Promise<DatabaseItem> {
    const payload: PutItemPayload = { value };
    return request<DatabaseItem>(
      this.url(`/v1/databases/${encodeURIComponent(locator)}/items`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }

  async deleteDatabaseItem(locator: string, pk: string, sk = ""): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(
      this.url(
        `/v1/databases/${encodeURIComponent(locator)}/items${this.params({ pk, sk })}`,
      ),
      { method: "DELETE" },
    );
    return res.deleted;
  }

  // -- database query --------------------------------------------------------

  async queryDatabase(locator: string, params: DatabaseQueryParams): Promise<DatabaseItem[]> {
    return request<DatabaseItem[]>(
      this.url(`/v1/databases/${encodeURIComponent(locator)}/query`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
    );
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
    env?: Record<string, string>;
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

  async updateWorkload(workloadId: string, updates: Partial<WorkloadInfo>): Promise<WorkloadInfo> {
    return request<WorkloadInfo>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async deleteWorkload(workloadId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}`), {
      method: "DELETE",
    });
  }

  async updateWorkloadStatus(workloadId: string, status: string, runtimeDetails?: Record<string, unknown>): Promise<WorkloadInfo> {
    const payload: Record<string, unknown> = { status };
    if (runtimeDetails) payload.runtime_details = runtimeDetails;
    return request<WorkloadInfo>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async getWorkloadMetrics(workloadId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/metrics`));
  }

  async getWorkloadLogs(workloadId: string): Promise<{ timestamp: string; message: string }[]> {
    return request<{ timestamp: string; message: string }[]>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/logs`));
  }

  async getWorkloadLaunchSpec(workloadId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url(`/v1/workloads/${encodeURIComponent(workloadId)}/launch-spec`));
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

  async getRoute(routeId: string): Promise<RouteInfo> {
    return request<RouteInfo>(this.url(`/v1/routes/${encodeURIComponent(routeId)}`));
  }

  async deleteRoute(routeId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/routes/${encodeURIComponent(routeId)}`), {
      method: "DELETE",
    });
  }

  // -- schedules -------------------------------------------------------------

  async listSchedules(workspaceId?: string, environmentId?: string): Promise<ScheduleInfo[]> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspace_id = workspaceId;
    if (environmentId) params.environment_id = environmentId;
    const q = Object.keys(params).length > 0 ? this.params(params) : "";
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

  async getSchedule(scheduleId: string): Promise<ScheduleInfo> {
    return request<ScheduleInfo>(this.url(`/v1/schedules/${encodeURIComponent(scheduleId)}`));
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

  async listImages(workspaceId?: string): Promise<ImageInfo[]> {
    const q = workspaceId ? this.params({ workspace_id: workspaceId }) : "";
    return request<ImageInfo[]>(this.url(`/v1/images${q}`));
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

  async deleteImage(imageId: string): Promise<boolean> {
    const res = await request<{ deleted: boolean }>(this.url(`/v1/images/${encodeURIComponent(imageId)}`), {
      method: "DELETE",
    });
    return res.deleted;
  }

  // -- billing ---------------------------------------------------------------

  async getAccount(userId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url(`/v1/accounts/${encodeURIComponent(userId)}`));
  }

  async getUser(userId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url(`/v1/users/${encodeURIComponent(userId)}`));
  }

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

  async createCheckout(userId: string, amountUsd: number, successUrl?: string, cancelUrl?: string): Promise<{ checkout_url: string | null; session_id: string | null; status: string }> {
    return request<{ checkout_url: string | null; session_id: string | null; status: string }>(this.url("/v1/billing/checkout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount_usd: amountUsd, success_url: successUrl, cancel_url: cancelUrl }),
    });
  }

  async getBillingHistory(userId: string): Promise<BillingHistoryEntry[]> {
    return request<BillingHistoryEntry[]>(this.url(`/v1/billing/history?user_id=${encodeURIComponent(userId)}`));
  }

  async getInvoices(userId: string): Promise<Record<string, unknown>[]> {
    return request<Record<string, unknown>[]>(this.url(`/v1/billing/invoices?user_id=${encodeURIComponent(userId)}`));
  }

  // -- usage -----------------------------------------------------------------

  async listUsage(workloadId?: string, ownerId?: string): Promise<UsageRecordInfo[]> {
    const params: Record<string, string> = {};
    if (workloadId) params.workload_id = workloadId;
    if (ownerId) params.owner_id = ownerId;
    const q = Object.keys(params).length > 0 ? this.params(params) : "";
    return request<UsageRecordInfo[]>(this.url(`/v1/usage${q}`));
  }

  async meterUsage(workloadId: string, cpuSeconds = 0, ramGbSeconds = 0, gpuSeconds = 0, storageGbSeconds = 0, egressGb = 0): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url("/v1/usage/meter"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workload_id: workloadId, cpu_seconds: cpuSeconds, ram_gb_seconds: ramGbSeconds, gpu_seconds: gpuSeconds, storage_gb_seconds: storageGbSeconds, egress_gb: egressGb }),
    });
  }

  // -- dashboard -------------------------------------------------------------

  async getDashboard(workspaceId: string, environmentId: string): Promise<DashboardSummary> {
    return request<DashboardSummary>(this.url(`/v1/dashboard/${encodeURIComponent(workspaceId)}/${encodeURIComponent(environmentId)}`));
  }

  async getDashboardSummary(workspaceId: string, environmentId: string): Promise<DashboardSummary> {
    return request<DashboardSummary>(this.url(`/v1/dashboard/${encodeURIComponent(workspaceId)}/${encodeURIComponent(environmentId)}/summary`));
  }

  // -- api keys --------------------------------------------------------------

  // (see above)

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

  async getInvite(inviteId: string): Promise<InviteInfo> {
    return request<InviteInfo>(this.url(`/v1/invites/${encodeURIComponent(inviteId)}`));
  }

  async acceptInvite(token: string): Promise<{ accepted: boolean }> {
    return request<{ accepted: boolean }>(this.url("/v1/invites/accept"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  }

  async deleteInvite(inviteId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(this.url(`/v1/invites/${encodeURIComponent(inviteId)}`), {
      method: "DELETE",
    });
  }

  // -- providers -------------------------------------------------------------

  async listProviders(): Promise<ProviderInfo[]> {
    return request<ProviderInfo[]>(this.url("/v1/providers"));
  }

  async getProvider(providerId: string): Promise<ProviderInfo> {
    return request<ProviderInfo>(this.url(`/v1/providers/${encodeURIComponent(providerId)}`));
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

  async providerHeartbeat(providerId: string, availableSlots = 0, runningWorkloads = 0, status = "online"): Promise<ProviderInfo> {
    return request<ProviderInfo>(this.url(`/v1/providers/${encodeURIComponent(providerId)}/heartbeat`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available_slots: availableSlots, running_workloads: runningWorkloads, status }),
    });
  }

  async claimNextAssignment(providerId: string): Promise<Record<string, unknown> | null> {
    return request<Record<string, unknown> | null>(this.url(`/v1/providers/${encodeURIComponent(providerId)}/assignments/next`), {
      method: "POST",
    });
  }

  // -- sandbox sessions ------------------------------------------------------

  async createSandboxSession(workloadId: string, requesterId: string, ttlSeconds = 900): Promise<SandboxSessionInfo> {
    return request<SandboxSessionInfo>(this.url("/v1/sandbox-sessions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workload_id: workloadId, requester_id: requesterId, ttl_seconds: ttlSeconds }),
    });
  }

  async verifySandboxSession(token: string): Promise<SandboxSessionInfo> {
    return request<SandboxSessionInfo>(this.url(`/v1/sandbox-sessions/verify?token=${encodeURIComponent(token)}`));
  }

  // -- runpod ----------------------------------------------------------------

  async dispatchRunPod(workloadId: string, template: string, gpuType?: string, gpuCount = 0, env?: Record<string, string>): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(this.url("/v1/runpod/dispatch"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workload_id: workloadId, template, gpu_type: gpuType, gpu_count: gpuCount, env: env || {} }),
    });
  }

  // -- pricing ---------------------------------------------------------------

  async getPricing(): Promise<Record<string, number>> {
    return request<Record<string, number>>(this.url("/v1/pricing"));
  }
}
