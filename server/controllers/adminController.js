const analyticsService = require('../services/analyticsService');
const userRepository = require('../repositories/userRepository');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await userRepository.findAll({}, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await userRepository.delete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};
