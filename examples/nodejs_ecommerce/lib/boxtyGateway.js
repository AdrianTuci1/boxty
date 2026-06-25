const DEFAULT_BASE_URL = process.env.BOXTY_GATEWAY_URL || 'http://127.0.0.1:8080';

class BoxtyGateway {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Boxty gateway request failed (${response.status}): ${text}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.arrayBuffer();
  }

  async ensureObjectVolume(name, sizeGb = 10) {
    const volumes = await this.request('/api/volumes');
    const existing = volumes.find((volume) => volume.name === name);
    if (existing) return existing;

    return this.request('/api/volumes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sizeGb,
        type: 'object-storage',
      }),
    });
  }

  async ensureDatabase(definition) {
    const databases = await this.request('/api/databases');
    const existing = databases.find((database) => database.name === definition.name);
    if (existing) return existing;

    return this.request('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(definition),
    });
  }

  async putItem(databaseId, value) {
    return this.request(`/api/databases/${encodeURIComponent(databaseId)}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  }

  async listItems(databaseId) {
    return this.request(`/api/databases/${encodeURIComponent(databaseId)}/items`);
  }

  async query(databaseId, query) {
    return this.request(`/api/databases/${encodeURIComponent(databaseId)}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
  }

  async deleteItem(databaseId, pk, sk = '') {
    const search = new URLSearchParams({ pk, sk });
    return this.request(`/api/databases/${encodeURIComponent(databaseId)}/items?${search.toString()}`, {
      method: 'DELETE',
    });
  }

  async uploadObject(volumeId, objectKey, buffer) {
    return this.request(`/api/volumes/${encodeURIComponent(volumeId)}/blob?path=${encodeURIComponent(objectKey)}`, {
      method: 'PUT',
      body: buffer,
    });
  }

  async deleteObject(volumeId, objectKey) {
    const search = new URLSearchParams({ path: objectKey });
    return this.request(`/api/volumes/${encodeURIComponent(volumeId)}/entries?${search.toString()}`, {
      method: 'DELETE',
    });
  }

  objectUrl(volumeName, objectKey) {
    return `${this.baseUrl}/objects/${encodeURIComponent(volumeName)}/${encodeURI(objectKey)}`;
  }
}

module.exports = {
  BoxtyGateway,
};
