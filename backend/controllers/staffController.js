const Staff = require('../models/Staff');
const { generateStaffId } = require('../utils/generateId');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getStaff = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.status = status;

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, staff, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.getStaffMember = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return errorResponse(res, 'Staff member not found', 404);
    return successResponse(res, staff);
  } catch (error) {
    next(error);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const staffId = await generateStaffId(Staff);
    const staff = await Staff.create({ ...req.body, staffId });
    return successResponse(res, staff, 'Staff member created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!staff) return errorResponse(res, 'Staff member not found', 404);
    return successResponse(res, staff, 'Staff member updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return errorResponse(res, 'Staff member not found', 404);
    return successResponse(res, null, 'Staff member deleted successfully');
  } catch (error) {
    next(error);
  }
};
