const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getLowStockProducts, createPurchaseEntry, getPurchaseEntries
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/purchases', getPurchaseEntries);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.post('/purchases', createPurchaseEntry);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
