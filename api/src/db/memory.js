// In-memory DynamoDB-compatible store for local development.
// No AWS account, no DynamoDB local, no Docker required.

const store = new Map(); // key: "pk|sk" -> value: item

function key(pk, sk) {
  return `${pk}|${sk}`;
}

export async function putItem(item) {
  const k = key(item.pk, item.sk);
  store.set(k, { ...item });
}

export async function getItem(pk, sk) {
  const k = key(pk, sk);
  return store.get(k) || null;
}

export async function queryByPK(pk, opts = {}) {
  const results = [];
  const prefix = `${pk}|`;
  for (const [k, v] of store) {
    if (k.startsWith(prefix)) results.push(v);
  }
  results.sort((a, b) => {
    const aSk = a.sk || '';
    const bSk = b.sk || '';
    return opts.ScanIndexForward !== false
      ? aSk.localeCompare(bSk)
      : bSk.localeCompare(aSk);
  });
  if (opts.Limit && results.length > opts.Limit) {
    return results.slice(0, opts.Limit);
  }
  return results;
}

// GSI emulation: we use an in-memory secondary index.
// Items can be indexed by creating a matching "pk" entry.
// For the common case (GSI1 where pk=STATUS#running), we scan the store.
export async function queryGSI(indexName, pkName, pkValue, opts = {}) {
  // Simple scan-based GSI: iterate all items and match
  const results = [];
  for (const [k, v] of store) {
    if (v[pkName] === pkValue || (pkName === 'pk' && k.startsWith(`${pkValue}|`))) {
      results.push(v);
    }
  }
  if (opts.Limit && results.length > opts.Limit) {
    return results.slice(0, opts.Limit);
  }
  return results;
}

export async function deleteItem(pk, sk) {
  const k = key(pk, sk);
  store.delete(k);
}

export async function updateItem(pk, sk, updates) {
  const k = key(pk, sk);
  const existing = store.get(k) || { pk, sk };
  store.set(k, { ...existing, ...updates });
}

// For tests / dev convenience
export function _clearStore() {
  store.clear();
}

export function _dumpStore() {
  return [...store.entries()].map(([k, v]) => ({ key: k, ...v }));
}
