const userRepository = require('../repositories/userRepository');
const Log = require('../models/Log');

class AuthService {
  async register(userData) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.create(userData);
    const token = user.getSignedJwtToken();

    // Log action
    await Log.create({ action: 'USER_REGISTER', performedBy: user._id });

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
      token,
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = user.getSignedJwtToken();

    await Log.create({ action: 'USER_LOGIN', performedBy: user._id });

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
      },
      token,
    };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    // Prevent password update through this method
    delete updateData.password;
    delete updateData.role;

    const user = await userRepository.update(userId, updateData);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await Log.create({ action: 'PROFILE_UPDATE', performedBy: userId });
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId)).email
    );

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    user.password = newPassword;
    await user.save();

    await Log.create({ action: 'PASSWORD_CHANGE', performedBy: userId });
    return { message: 'Password updated successfully' };
  }
}

module.exports = new AuthService();
