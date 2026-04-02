const express = require('express');
const router = express.Router();
const { issueInventory, getStudentInventory, getAllIssuedInventory, returnInventory } = require('../controllers/studentInventoryController');

router.get('/', getAllIssuedInventory);
router.get('/student/:studentId', getStudentInventory);
router.post('/issue', issueInventory);
router.put('/:id/return', returnInventory);

module.exports = router;
