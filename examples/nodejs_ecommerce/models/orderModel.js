const { BoxtyGateway } = require('../lib/boxtyGateway');

class OrderModel {
  constructor() {
    this.gateway = new BoxtyGateway();
    this.databaseName = 'ecommerce-orders';
    this.databasePromise = this.gateway.ensureDatabase({
      name: this.databaseName,
      pkName: 'pk',
      skName: 'sk',
      gsiName: 'StatusIndex',
      gsiPkName: 'gsi1pk',
      gsiSkName: 'gsi1sk',
    });
  }

  async getDatabase() {
    return this.databasePromise;
  }

  async save(orderData) {
    const database = await this.getDatabase();
    const orderTimestamp = orderData.createdAt || new Date().toISOString();
    const item = {
      pk: `USER#${orderData.userId}`,
      sk: `ORDER#${orderTimestamp}`,
      gsi1pk: `STATUS#${orderData.status}`,
      gsi1sk: `ORDER#${orderTimestamp}`,
      orderId: orderData.id,
      userId: orderData.userId,
      status: orderData.status,
      totalAmount: orderData.totalAmount,
      items: orderData.items,
      createdAt: orderTimestamp,
    };

    await this.gateway.putItem(database.id, item);
    return orderData;
  }

  async findCompletedOrders() {
    const database = await this.getDatabase();
    const records = await this.gateway.query(database.id, {
      gsiPk: 'STATUS#completed',
      gsiSkBeginsWith: 'ORDER#',
    });

    return records.map((record) => record.value);
  }

  async findOrdersForUserInRange(userId, fromIso, toIso) {
    const database = await this.getDatabase();
    const records = await this.gateway.query(database.id, {
      pk: `USER#${userId}`,
      skFrom: `ORDER#${fromIso}`,
      skTo: `ORDER#${toIso}`,
    });

    return records.map((record) => record.value);
  }
}

module.exports = OrderModel;
