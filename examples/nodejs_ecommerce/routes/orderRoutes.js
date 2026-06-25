const express = require('express');
const OrderController = require('../controllers/orderController');

const router = express.Router();
const controller = new OrderController();

router.post('/checkout', (req, res) => controller.checkout(req, res));
router.get('/', (req, res) => controller.getHistory(req, res));
router.get('/user/:userId/range', (req, res) => controller.getUserRange(req, res));

module.exports = router;
