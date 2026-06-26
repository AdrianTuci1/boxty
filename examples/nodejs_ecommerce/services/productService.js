const ProductModel = require('../models/productModel');
const { BoxtyGateway } = require('../lib/boxtyGateway');

class ProductService {
  constructor() {
    this.productModel = new ProductModel();
    this.gateway = new BoxtyGateway();
    this.volumePromise = this.gateway.ensureObjectVolume('product-images', 20);
  }

  async createProduct(name, price, category, imageBuffer = null) {
    console.log(`[Service] Creating product ${name} (${price} USD)`);

    const productId = Math.floor(Math.random() * 100000);
    let imageUrl = null;

    if (imageBuffer) {
      const volume = await this.volumePromise;
      const objectKey = `products/photo_${productId}.jpg`;
      await this.gateway.uploadObject(volume.id, objectKey, imageBuffer);
      imageUrl = this.gateway.objectUrl(volume.name, objectKey);
    }

    const product = {
      id: productId,
      name,
      price,
      category,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    return this.productModel.save(product);
  }

  async listProducts() {
    return this.productModel.findAll();
  }

  async listProductsByCategoryAndPrice(category, minPrice, maxPrice) {
    return this.productModel.findByCategoryAndPriceRange(category, minPrice, maxPrice);
  }

  async updateProduct(id, name, price, category, imageBuffer = null) {
    const volume = await this.volumePromise;
    let imageUrl;

    if (imageBuffer) {
      const objectKey = `products/photo_${id}.jpg`;
      await this.gateway.uploadObject(volume.id, objectKey, imageBuffer);
      imageUrl = this.gateway.objectUrl(volume.name, objectKey);
    }

    const product = {
      id,
      name,
      price,
      category,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };

    return this.productModel.update(id, product);
  }

  async deleteProduct(id) {
    const volume = await this.volumePromise;
    await this.gateway.deleteObject(volume.id, `products/photo_${id}.jpg`).catch(() => {});
    return this.productModel.delete(id);
  }
}

module.exports = ProductService;
