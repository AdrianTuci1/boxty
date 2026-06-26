const express = require('express');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const { BoxtyGateway } = require('./lib/boxtyGateway');

const expressApp = express();
const gateway = new BoxtyGateway();

expressApp.use(express.json({ limit: '10mb' }));
expressApp.use('/api/orders', orderRoutes);
expressApp.use('/api/products', productRoutes);

async function initializeBoxtyResources() {
  await Promise.all([
    gateway.ensureObjectVolume('product-images', 20),
    gateway.ensureDatabase({
      name: 'ecommerce-orders',
      pkName: 'pk',
      skName: 'sk',
      gsiName: 'StatusIndex',
      gsiPkName: 'gsi1pk',
      gsiSkName: 'gsi1sk',
    }),
    gateway.ensureDatabase({
      name: 'ecommerce-products',
      pkName: 'pk',
      skName: 'sk',
      gsiName: 'CategoryPriceIndex',
      gsiPkName: 'gsi1pk',
      gsiSkName: 'gsi1sk',
    }),
  ]);

  console.log('[Boxty] Gateway-backed resources are ready.');
  console.log('[Boxty] Object URLs will be served from: http://127.0.0.1:8080/objects/product-images/<key>');
  console.log('[Boxty] Range query examples:');
  console.log('  GET /api/orders/user/<userId>/range?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z');
  console.log('  GET /api/products/category/books/range?minPrice=10&maxPrice=80');
}

initializeBoxtyResources().catch((error) => {
  console.error('[Boxty] Failed to initialize local gateway resources:', error);
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  expressApp.listen(port, () => {
    console.log(`[Boxty] Node.js example listening on http://127.0.0.1:${port}`);
  });
}

module.exports = expressApp;
