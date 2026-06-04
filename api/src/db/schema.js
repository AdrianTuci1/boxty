import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import * as memory from './memory.js';

let useMemory = false;

// Try DynamoDB on first call; if connection refused, fall back to in-memory store.
async function tryDynamoDB() {
  if (useMemory) return;
  try {
    const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region, maxAttempts: 1 });
    const dc = DynamoDBDocumentClient.from(c);
    await dc.send(new GetCommand({ TableName: config.dynamodb.table, Key: { pk: '__health__', sk: '__health__' } }));
  } catch (err) {
    useMemory = true;
    console.warn('DynamoDB unreachable, using in-memory store. Error:', err.message);
  }
}

export async function putItem(item) {
  await tryDynamoDB();
  if (useMemory) return memory.putItem(item);
  const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region });
  const dc = DynamoDBDocumentClient.from(c);
  return dc.send(new PutCommand({ TableName: config.dynamodb.table, Item: item }));
}

export async function getItem(pk, sk) {
  await tryDynamoDB();
  if (useMemory) return memory.getItem(pk, sk);
  const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region });
  const dc = DynamoDBDocumentClient.from(c);
  const res = await dc.send(new GetCommand({ TableName: config.dynamodb.table, Key: { pk, sk } }));
  return res.Item;
}

export async function queryByPK(pk, opts = {}) {
  await tryDynamoDB();
  if (useMemory) return memory.queryByPK(pk, opts);
  const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region });
  const dc = DynamoDBDocumentClient.from(c);
  const res = await dc.send(new QueryCommand({
    TableName: config.dynamodb.table,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': pk },
    ...opts,
  }));
  return res.Items || [];
}

export async function queryGSI(indexName, pkName, pkValue, opts = {}) {
  await tryDynamoDB();
  if (useMemory) return memory.queryGSI(indexName, pkName, pkValue, opts);
  const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region });
  const dc = DynamoDBDocumentClient.from(c);
  const res = await dc.send(new QueryCommand({
    TableName: config.dynamodb.table,
    IndexName: indexName,
    KeyConditionExpression: `${pkName} = :pk`,
    ExpressionAttributeValues: { ':pk': pkValue },
    ...opts,
  }));
  return res.Items || [];
}

export async function deleteItem(pk, sk) {
  await tryDynamoDB();
  if (useMemory) return memory.deleteItem(pk, sk);
  const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region });
  const dc = DynamoDBDocumentClient.from(c);
  return dc.send(new DeleteCommand({ TableName: config.dynamodb.table, Key: { pk, sk } }));
}

export async function updateItem(pk, sk, updates) {
  await tryDynamoDB();
  if (useMemory) return memory.updateItem(pk, sk, updates);
  const c = new DynamoDBClient({ endpoint: config.dynamodb.endpoint, region: config.dynamodb.region });
  const dc = DynamoDBDocumentClient.from(c);
  const keys = Object.keys(updates);
  const expr = 'set ' + keys.map((k, i) => `#f${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(keys.map((k, i) => [`#f${i}`, k]));
  const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));
  return dc.send(new UpdateCommand({
    TableName: config.dynamodb.table,
    Key: { pk, sk },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}
