/**
 * Boxty DynamoDB — Single Table Design
 *
 * PK (Partition Key): entity type
 * SK (Sort Key): unique identifier
 *
 * PK patterns:
 *   USER#<id>
 *   SANDBOX#<id>
 *   WORKER#<id>
 *   DEPLOYMENT#<id>
 *   BILLING#<user_id>
 *   USAGE#<user_id>
 *   SECRET#<user_id>
 *   VOLUME#<id>
 *
 * GSI1: status-based queries
 *   PK: STATUS#<status>
 *   SK: <created_at>
 *
 * GSI2: user-based sandbox listing
 *   PK: USER_SANDBOXES#<user_id>
 *   SK: <created_at>
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { config } = require('../config.js');

let clientConfig = { region: config.DYNAMODB_REGION };
if (config.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = config.DYNAMODB_ENDPOINT;
}

const client = new DynamoDBClient(clientConfig);
const doc = DynamoDBDocument.from(client);

export async function createTable() {
  const params = {
    TableName: config.DYNAMODB_TABLE,
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1_PK', AttributeType: 'S' },
      { AttributeName: 'GSI1_SK', AttributeType: 'S' },
      { AttributeName: 'GSI2_PK', AttributeType: 'S' },
      { AttributeName: 'GSI2_SK', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1_PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1_SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'GSI2',
        KeySchema: [
          { AttributeName: 'GSI2_PK', KeyType: 'HASH' },
          { AttributeName: 'GSI2_SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  };

  try {
    await client.send(new (require('@aws-sdk/client-dynamodb').CreateTableCommand)(params));
    console.log('✅ Table created:', config.DYNAMODB_TABLE);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('ℹ️  Table already exists:', config.DYNAMODB_TABLE);
    } else {
      throw err;
    }
  }
}

export async function putItem(item) {
  return doc.put({
    TableName: config.DYNAMODB_TABLE,
    Item: item,
  });
}

export async function getItem(PK, SK) {
  const result = await doc.get({
    TableName: config.DYNAMODB_TABLE,
    Key: { PK, SK },
  });
  return result.Item;
}

export async function queryByPK(PK) {
  const result = await doc.query({
    TableName: config.DYNAMODB_TABLE,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': PK },
  });
  return result.Items || [];
}

export async function queryGSI1(PK, options = {}) {
  const params = {
    TableName: config.DYNAMODB_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1_PK = :pk',
    ExpressionAttributeValues: { ':pk': PK },
  };
  if (options.limit) params.Limit = options.limit;
  const result = await doc.query(params);
  return result.Items || [];
}

export async function queryGSI2(PK) {
  const result = await doc.query({
    TableName: config.DYNAMODB_TABLE,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2_PK = :pk',
    ExpressionAttributeValues: { ':pk': PK },
  });
  return result.Items || [];
}

export async function updateItem(PK, SK, updates) {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  let i = 0;

  for (const [key, value] of Object.entries(updates)) {
    const nameKey = `#${key}`;
    const valueKey = `:val${i}`;
    updateExpression.push(`${nameKey} = ${valueKey}`);
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = value;
    i++;
  }

  return doc.update({
    TableName: config.DYNAMODB_TABLE,
    Key: { PK, SK },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });
}

export { client, doc };
