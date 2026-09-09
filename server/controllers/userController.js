const User = require('../models/User');

exports.togglePreferredProduct = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { productId } = req.body;

    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      const error = new Error('Not authorized to access this route');
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const index = user.preferredProducts.findIndex(p => p.toString() === productId.toString());
    let isPreferred = false;

    if (index === -1) {
      user.preferredProducts.push(productId);
      isPreferred = true;
    } else {
      user.preferredProducts.splice(index, 1);
    }

    await user.save();

    res.status(200).json({ success: true, data: { isPreferred, preferredProducts: user.preferredProducts } });
  } catch (error) { next(error); }
};

exports.getPreferredProducts = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      const error = new Error('Not authorized to access this route');
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findById(userId).populate({
      path: 'preferredProducts',
      populate: [
        { path: 'categoryId', select: 'categoryName' },
        { path: 'brandId', select: 'brandName' }
      ]
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: user.preferredProducts });
  } catch (error) { next(error); }
};
