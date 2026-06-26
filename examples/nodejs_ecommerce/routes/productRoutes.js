const express = require('express');
const ProductController = require('../controllers/productController');

const router = express.Router();
const controller = new ProductController();

router.post('/', (req, res) => controller.create(req, res));
router.get('/', (req, res) => controller.list(req, res));
router.get('/category/:category/range', (req, res) => controller.listByCategoryRange(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

module.exports = router;
