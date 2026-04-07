const Student = require('../models/Student');
const { generateStudentId } = require('../utils/generateId');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', class: cls, section, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (cls) query.class = cls;
    if (section) query.section = section;
    if (status) query.status = status;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, students, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return errorResponse(res, 'Student not found', 404);
    return successResponse(res, student);
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const studentId = await generateStudentId(Student);
    const student = await Student.create({ ...req.body, studentId });
    return successResponse(res, student, 'Student created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!student) return errorResponse(res, 'Student not found', 404);
    return successResponse(res, student, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return errorResponse(res, 'Student not found', 404);
    return successResponse(res, null, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/students/next-roll-number?class=Playgroup
exports.getNextRollNumber = async (req, res, next) => {
  try {
    const cls = req.query.class;
    const PREFIX_MAP = {
      'Playgroup': 'SKIS01',
      'Pre-KG':   'SKIS02',
      'LKG':      'SKIS03',
      'UKG':      'SKIS04',
    };

    const prefix = PREFIX_MAP[cls];
    if (!prefix) return errorResponse(res, 'Class not supported for auto roll number', 400);

    const year = new Date().getFullYear().toString().slice(-2); // "26"
    const basePrefix = `${prefix}${year}`; // e.g. "SKIS0126"

    // Find all students in this class with matching roll number pattern
    const students = await Student.find({
      class: cls,
      rollNumber: { $regex: `^${basePrefix}` }
    }).select('rollNumber');

    let maxSeq = 0;
    students.forEach(s => {
      const seq = parseInt(s.rollNumber.replace(basePrefix, ''), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });

    const nextSeq = (maxSeq === 0 ? 1 : maxSeq + 1).toString().padStart(3, '0');
    const rollNumber = `${basePrefix}${nextSeq}`;

    return successResponse(res, { rollNumber });
  } catch (error) {
    next(error);
  }
};

exports.getStudentProfile = async (req, res, next) => {
  try {
    const StudentInventory = require('../models/StudentInventory');
    const Invoice = require('../models/Invoice');
    const Fee = require('../models/Fee');

    const student = await Student.findById(req.params.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const [inventory, invoices, fees] = await Promise.all([
      StudentInventory.find({ student: req.params.id }).populate('product'),
      Invoice.find({ student: req.params.id }).sort({ createdAt: -1 }).limit(10),
      Fee.find({ student: req.params.id }).sort({ dueDate: -1 })
    ]);

    return successResponse(res, { student, inventory, invoices, fees });
  } catch (error) {
    next(error);
  }
};
