const express = require('express');
const router = express.Router();
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentProfile, getNextRollNumber } = require('../controllers/studentController');

router.get('/', getStudents);
router.get('/next-roll-number', getNextRollNumber);
router.get('/:id', getStudent);
router.get('/:id/profile', getStudentProfile);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
