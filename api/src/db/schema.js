import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';

const client = new DynamoDBClient({
  endpoint: config.dynamodb.endpoint,
  region: config.dynamodb.region,
});

export const docClient = DynamoDBDocumentClient.from(client);
export const TableName = config.dynamodb.table;

export async function putItem(item) {
  return docClient.send(new PutCommand({ TableName, Item: item }));
}

export async function getItem(pk, sk) {
  const res = await docClient.send(new GetCommand({ TableName, Key: { pk, sk } }));
  return res.Item;
}

export async function queryByPK(pk, opts = {}) {
  const res = await docClient.send(new QueryCommand({
    TableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': pk },
    ...opts,
  }));
  return res.Items || [];
}

export async function queryGSI(indexName, pkName, pkValue, opts = {}) {
  const res = await docClient.send(new QueryCommand({
    TableName,
    IndexName: indexName,
    KeyConditionExpression: `${pkName} = :pk`,
    ExpressionAttributeValues: { ':pk': pkValue },
    ...opts,
  }));
  return res.Items || [];
}

export async function deleteItem(pk, sk) {
  return docClient.send(new DeleteCommand({ TableName, Key: { pk, sk } }));
}

export async function updateItem(pk, sk, updates) {
  const keys = Object.keys(updates);
  const expr = 'set ' + keys.map((k, i) => `#f${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(keys.map((k, i) => [`#f${i}`, k]));
  const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));
  return docClient.send(new UpdateCommand({
    TableName,
    Key: { pk, sk },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}
