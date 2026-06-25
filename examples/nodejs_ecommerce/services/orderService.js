const OrderModel = require('../models/orderModel');

class OrderService {
  constructor() {
    this.orderModel = new OrderModel();
  }

  async processOrder(userId, cartItems) {
    console.log(`[Service] Processing checkout for user ${userId}`);

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id: Math.floor(Math.random() * 100000),
      userId,
      items: cartItems,
      totalAmount,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    return this.orderModel.save(order);
  }

  async getCompletedOrders() {
    return this.orderModel.findCompletedOrders();
  }

  async getUserOrdersInRange(userId, fromIso, toIso) {
    return this.orderModel.findOrdersForUserInRange(userId, fromIso, toIso);
  }
}

module.exports = OrderService;
