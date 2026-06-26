const { BoxtyGateway } = require('../lib/boxtyGateway');

function encodePrice(price) {
  return String(Math.round(Number(price) * 100)).padStart(12, '0');
}

class ProductModel {
  constructor() {
    this.gateway = new BoxtyGateway();
    this.databaseName = 'ecommerce-products';
    this.databasePromise = this.gateway.ensureDatabase({
      name: this.databaseName,
      pkName: 'pk',
      skName: 'sk',
      gsiName: 'CategoryPriceIndex',
      gsiPkName: 'gsi1pk',
      gsiSkName: 'gsi1sk',
    });
  }

  async getDatabase() {
    return this.databasePromise;
  }

  async save(productData) {
    const database = await this.getDatabase();
    const item = {
      pk: `PRODUCT#${productData.id}`,
      sk: 'METADATA',
      gsi1pk: `CATEGORY#${productData.category}`,
      gsi1sk: `PRICE#${encodePrice(productData.price)}#PRODUCT#${productData.id}`,
      productId: productData.id,
      name: productData.name,
      price: productData.price,
      category: productData.category,
      imageUrl: productData.imageUrl,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt || null,
    };

    await this.gateway.putItem(database.id, item);
    return productData;
  }

  async findAll() {
    const database = await this.getDatabase();
    const records = await this.gateway.listItems(database.id);
    return records.map((record) => record.value);
  }

  async findById(id) {
    const database = await this.getDatabase();
    const records = await this.gateway.query(database.id, {
      pk: `PRODUCT#${id}`,
      sk: 'METADATA',
      limit: 1,
    });

    return records[0]?.value || null;
  }

  async findByCategoryAndPriceRange(category, minPrice, maxPrice) {
    const database = await this.getDatabase();
    const records = await this.gateway.query(database.id, {
      gsiPk: `CATEGORY#${category}`,
      gsiSkFrom: `PRICE#${encodePrice(minPrice)}#`,
      gsiSkTo: `PRICE#${encodePrice(maxPrice)}#~`,
    });

    return records.map((record) => record.value);
  }

  async update(id, productData) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Product ${id} not found`);
    }

    return this.save({
      ...existing,
      ...productData,
      id,
      createdAt: existing.createdAt,
      imageUrl: productData.imageUrl ?? existing.imageUrl ?? null,
    });
  }

  async delete(id) {
    const database = await this.getDatabase();
    await this.gateway.deleteItem(database.id, `PRODUCT#${id}`, 'METADATA');
    return true;
  }
}

module.exports = ProductModel;
