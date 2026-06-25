const ProductService = require('../services/productService');

class ProductController {
    constructor() {
        this.productService = new ProductService();
    }

    async create(req, res) {
        try {
            const { name, price, category, imageBase64 } = req.body;
            if (!name || price === undefined || !category) {
                return res.status(400).json({ error: 'Date produs incomplete' });
            }

            // Convertim o imagine Base64 trimisă de client în buffer (pentru Object Storage upload)
            let imageBuffer = null;
            if (imageBase64) {
                imageBuffer = Buffer.from(imageBase64, 'base64');
            }

            const product = await this.productService.createProduct(name, price, category, imageBuffer);
            return res.status(201).json({ success: true, product });
        } catch (error) {
            console.error('[Controller] Eroare la crearea produsului:', error);
            return res.status(500).json({ error: 'Eroare internă de server' });
        }
    }

    async list(req, res) {
        try {
            const products = await this.productService.listProducts();
            return res.json({ products });
        } catch (error) {
            console.error('[Controller] Eroare la listarea produselor:', error);
            return res.status(500).json({ error: 'Eroare internă' });
        }
    }

    async listByCategoryRange(req, res) {
        try {
            const { category } = req.params;
            const { minPrice = 0, maxPrice = 999999 } = req.query;
            const products = await this.productService.listProductsByCategoryAndPrice(
                category,
                Number(minPrice),
                Number(maxPrice),
            );
            return res.json({ products });
        } catch (error) {
            console.error('[Controller] Eroare la category/price range:', error);
            return res.status(500).json({ error: 'Eroare internă' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, price, category, imageBase64 } = req.body;
            
            let imageBuffer = null;
            if (imageBase64) {
                imageBuffer = Buffer.from(imageBase64, 'base64');
            }

            const updatedProduct = await this.productService.updateProduct(id, name, price, category, imageBuffer);
            return res.json({ success: true, product: updatedProduct });
        } catch (error) {
            console.error('[Controller] Eroare la actualizarea produsului:', error);
            return res.status(500).json({ error: 'Eroare internă' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.productService.deleteProduct(id);
            return res.json({ success: true, message: `Produsul ${id} a fost șters.` });
        } catch (error) {
            console.error('[Controller] Eroare la ștergerea produsului:', error);
            return res.status(500).json({ error: 'Eroare internă' });
        }
    }
}

module.exports = ProductController;
