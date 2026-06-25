const OrderService = require('../services/orderService');

class OrderController {
    constructor() {
        this.orderService = new OrderService();
    }

    async checkout(req, res) {
        try {
            const { userId, items } = req.body;
            if (!userId || !items) {
                return res.status(400).json({ error: 'Date invalide' });
            }

            const processedOrder = await this.orderService.processOrder(userId, items);
            return res.status(201).json({ success: true, order: processedOrder });
        } catch (error) {
            console.error('[Controller] Eroare la checkout:', error);
            return res.status(500).json({ error: 'Eroare internă de server' });
        }
    }

    async getHistory(req, res) {
        try {
            const orders = await this.orderService.getCompletedOrders();
            return res.json({ orders });
        } catch (error) {
            console.error('[Controller] Eroare la istoric:', error);
            return res.status(500).json({ error: 'Eroare internă' });
        }
    }

    async getUserRange(req, res) {
        try {
            const { userId } = req.params;
            const { from, to } = req.query;
            if (!from || !to) {
                return res.status(400).json({ error: 'from și to sunt obligatorii' });
            }

            const orders = await this.orderService.getUserOrdersInRange(userId, from, to);
            return res.json({ orders });
        } catch (error) {
            console.error('[Controller] Eroare la range query:', error);
            return res.status(500).json({ error: 'Eroare internă' });
        }
    }
}

module.exports = OrderController;
