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
