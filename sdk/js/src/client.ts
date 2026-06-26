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
}
