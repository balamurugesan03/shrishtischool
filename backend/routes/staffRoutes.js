const express = require('express');
const router = express.Router();
const { getStaff, getStaffMember, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

router.get('/', getStaff);
router.get('/:id', getStaffMember);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
