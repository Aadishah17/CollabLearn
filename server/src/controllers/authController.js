const User = require('../models/User');
const Admin = require('../models/Admin');
const Availability = require('../models/Availability');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const Setting = require('../models/Setting');
const { getAccessProfile, normalizeEmail } = require('../config/access');
const { avatarUploadsPath } = require('../config/storage');
const {
  clearAuthCookie,
  resolveJwtSecret,
  setAuthCookie
} = require('../config/auth');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

const getMinimumPasswordLength = async () => {
  try {
    const settings = await Setting.findOne({ key: 'main_settings' })
      .select('minPasswordLength')
      .lean();
    const configuredLength = Number(settings?.minPasswordLength);

    if (Number.isInteger(configuredLength) && configuredLength >= 6) {
      return configuredLength;
    }
  } catch (_error) {
    // Fall back to the schema minimum if settings lookup fails.
  }

  return 6;
};

const createSessionToken = ({ userId, email, role, isSuperAdmin }) =>
  jwt.sign(
    {
      userId,
      email,
      role,
      isSuperAdmin: Boolean(isSuperAdmin)
    },
    resolveJwtSecret(),
    { expiresIn: '7d' }
  );

const sendSessionResponse = ({ res, statusCode = 200, message, token, user, extra = {} }) => {
  setAuthCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user,
    ...extra
  });
};

const buildSessionUser = ({ account, accountType, role, isSuperAdmin }) => {
  const baseUser = {
    id: account._id,
    email: account.email,
    role,
    isSuperAdmin: Boolean(isSuperAdmin)
  };

  if (accountType === 'admin') {
    return {
      ...baseUser,
      name: isSuperAdmin ? 'Super Admin' : 'Admin',
      avatar: null,
      avatarType: 'default',
      isPremium: false,
      createdAt: account.createdAt
    };
  }

  return {
    ...baseUser,
    name: account.name,
    avatar: account.getAvatarUrl(),
    avatarType: account.avatar?.type,
    isPremium: account.isPremium || false,
    createdAt: account.createdAt
  };
};

const findLoginCandidates = async (email, requestedRole, isSuperAdmin) => {
  const lookupOrder = [];

  if (requestedRole === 'admin') {
    lookupOrder.push({ accountType: 'admin', model: Admin });
    if (isSuperAdmin) {
      lookupOrder.push({ accountType: 'user', model: User });
    }
  } else {
    lookupOrder.push({ accountType: 'user', model: User });
    if (isSuperAdmin) {
      lookupOrder.push({ accountType: 'admin', model: Admin });
    }
  }

  const candidates = [];

  for (const lookup of lookupOrder) {
    const account = await lookup.model.findOne({ email });
    if (account) {
      candidates.push({
        account,
        accountType: lookup.accountType
      });
    }
  }

  return candidates;
};

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const minimumPasswordLength = await getMinimumPasswordLength();
      const normalizedEmail = normalizeEmail(email);
      const accessProfile = getAccessProfile(normalizedEmail, 'user');

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields (name, email, password) are required'
        });
      }

      if (password.length < minimumPasswordLength) {
        return res.status(400).json({
          success: false,
          message: `Password must be at least ${minimumPasswordLength} characters long`
        });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
      });

      await user.save();

      const token = createSessionToken({
        userId: user._id,
        email: user.email,
        role: accessProfile.role,
        isSuperAdmin: accessProfile.isSuperAdmin
      });

      return sendSessionResponse({
        res,
        statusCode: 201,
        message: 'User registered successfully',
        token,
        user: buildSessionUser({
          account: user,
          accountType: 'user',
          role: accessProfile.role,
          isSuperAdmin: accessProfile.isSuperAdmin
        })
      });

    } catch (error) {
      console.error('Registration error:', error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {})
          .map((detail) => detail && detail.message)
          .filter(Boolean);
        return res.status(400).json({
          success: false,
          message: messages[0] || 'Invalid registration details'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password, role = 'user' } = req.body;
      const requestedRole = role === 'admin' ? 'admin' : 'user';
      const normalizedEmail = normalizeEmail(email);
      const accessProfile = getAccessProfile(normalizedEmail, requestedRole);

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const candidates = await findLoginCandidates(
        normalizedEmail,
        requestedRole,
        accessProfile.isSuperAdmin
      );

      if (!candidates.length) {
        return res.status(401).json({
          success: false,
          message: requestedRole === 'admin' ? 'Invalid admin credentials' : 'Invalid email or password'
        });
      }

      let matchedCandidate = null;

      for (const candidate of candidates) {
        const isPasswordValid = await bcrypt.compare(password, candidate.account.password);
        if (isPasswordValid) {
          matchedCandidate = candidate;
          break;
        }
      }

      if (!matchedCandidate) {
        return res.status(401).json({
          success: false,
          message: requestedRole === 'admin' ? 'Invalid admin credentials' : 'Invalid email or password'
        });
      }

      const { account, accountType } = matchedCandidate;
      const sessionRole = accountType === 'admin' ? 'admin' : accessProfile.role;

      if (!account.isActive) {
        return res.status(401).json({
          success: false,
          message:
            sessionRole === 'admin'
              ? 'Admin account is deactivated. Please contact support.'
              : 'Account is deactivated. Please contact support.'
        });
      }

      const token = createSessionToken({
        userId: account._id,
        email: account.email,
        role: sessionRole,
        isSuperAdmin: accessProfile.isSuperAdmin
      });

      return sendSessionResponse({
        res,
        message: 'Login successful',
        token,
        user: buildSessionUser({
          account,
          accountType,
          role: sessionRole,
          isSuperAdmin: accessProfile.isSuperAdmin
        })
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;

      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
      });

      const { name, email, picture } = ticket.getPayload();
      const normalizedEmail = normalizeEmail(email);
      const accessProfile = getAccessProfile(normalizedEmail, 'user');

      let user = await User.findOne({ email: normalizedEmail });
      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        user = new User({
          name,
          email: normalizedEmail,
          password: await bcrypt.hash(Math.random().toString(36).slice(-8), 12), // Dummy password
          avatar: {
            type: 'url',
            url: picture,
            filename: '',
            uploadDate: new Date()
          },
          isGoogleAuth: true
        });
        await user.save();
      }

      const jwtToken = createSessionToken({
        userId: user._id,
        email: user.email,
        role: accessProfile.role,
        isSuperAdmin: accessProfile.isSuperAdmin
      });

      return sendSessionResponse({
        res,
        statusCode: isNewUser ? 201 : 200,
        message: 'Google login successful',
        token: jwtToken,
        user: buildSessionUser({
          account: user,
          accountType: 'user',
          role: accessProfile.role,
          isSuperAdmin: accessProfile.isSuperAdmin
        })
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      let user = await User.findById(req.userId)
        .select('-password')
        .populate('skillsOffering')
        .populate('skillsSeeking');

      if (!user) {
        if (req.userRole === 'admin') {
          const admin = await Admin.findById(req.userId).select('-password');

          if (!admin) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }

          const adminAccess = getAccessProfile(admin.email, 'admin');

          return res.json({
            success: true,
            user: {
              id: admin._id,
              name: adminAccess.isSuperAdmin ? 'Super Admin' : 'Admin',
              email: admin.email,
              role: 'admin',
              isSuperAdmin: adminAccess.isSuperAdmin,
              avatar: null,
              avatarType: 'default',
              bio: '',
              isPremium: false,
              skillsOffering: [],
              skillsSeeking: [],
              availability: null,
              rating: { average: 0, count: 0 },
              totalSessions: 0,
              badges: [],
              joinDate: admin.createdAt,
              createdAt: admin.createdAt
            }
          });
        }

        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const availability = await Availability.getUserAvailability(req.userId);
      const accessProfile = getAccessProfile(user.email, req.userRole || 'user');

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: accessProfile.role,
          isSuperAdmin: accessProfile.isSuperAdmin,
          avatar: user.getAvatarUrl(),
          avatarType: user.avatar?.type,
          bio: user.bio,
          isPremium: user.isPremium || false,
          skillsOffering: user.skillsOffering,
          skillsSeeking: user.skillsSeeking,
          availability: availability,
          rating: user.rating,
          totalSessions: user.totalSessions,
          badges: user.badges,
          joinDate: user.createdAt,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.userId;
      const { name, bio, avatar, isPremium } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update basic fields
      if (name) user.name = name.trim();
      if (bio !== undefined) user.bio = String(bio || '').trim();
      // Allow toggling premium flag when provided (admin or payment flow)
      if (typeof isPremium !== 'undefined') {
        user.isPremium = Boolean(isPremium);
      }

      // Update avatar using the new helper method
      if (avatar !== undefined) {
        user.setAvatar(avatar);
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.getAvatarUrl(), // Use the helper method
          avatarType: user.avatar?.type,
          rating: user.rating,
          totalSessions: user.totalSessions,
          badges: user.badges,
          isPremium: user.isPremium || false,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  logout: async (_req, res) => {
    clearAuthCookie(res);

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  },

  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const previousAvatarType = user.avatar?.type;
      const previousAvatarFilename = user.avatar?.filename;

      user.setAvatar(req.file.filename);
      await user.save();

      // Cleanup older uploaded avatar file after successful save.
      if (
        previousAvatarType === 'upload' &&
        previousAvatarFilename &&
        previousAvatarFilename !== req.file.filename
      ) {
        const oldFilename = path.basename(String(previousAvatarFilename));
        const oldFilePath = path.join(avatarUploadsPath, oldFilename);
        fs.unlink(oldFilePath, (_error) => {
          // Ignore cleanup failures to avoid breaking successful upload flow.
        });
      }

      return res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        user: {
          id: user._id,
          avatar: user.getAvatarUrl(),
          avatarType: user.avatar?.type,
          avatarFilename: user.avatar?.filename || ''
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload avatar'
      });
    }
  },

  // DELETE /api/auth/delete - Permanently delete current user's account and related data
  deleteAccount: async (req, res) => {
    try {
      const userId = req.userId;

      // Basic safety: ensure user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Remove related documents that reference the user.
      // Use require here to avoid circular requires at module top if any.
      const Skill = require('../models/Skill');
      const Post = require('../models/Post');
      const Message = require('../models/Message');
      const Booking = require('../models/Booking');
      const Availability = require('../models/Availability');

      // Delete skills created by user
      await Skill.deleteMany({ user: userId });

      // Delete posts authored by user
      await Post.deleteMany({ userId: userId });

      // Delete messages sent by user (chat history may be kept in real apps)
      await Message.deleteMany({ $or: [{ senderId: String(userId) }, { senderId: user.email }] });

      // Remove bookings where user is student or instructor
      await Booking.deleteMany({ $or: [{ student: userId }, { instructor: userId }] });

      // Remove availability entries
      await Availability.deleteMany({ userId: userId });

      // Finally remove the user
      await User.findByIdAndDelete(userId);

      clearAuthCookie(res);

      res.json({ success: true, message: 'Account and related data deleted successfully' });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ success: false, message: 'Server error deleting account' });
    }
  },

  // Get user by ID (public route for profile viewing)
  getUserById: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password')
        .populate('skillsOffering')
        .populate('skillsSeeking');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const accessProfile = getAccessProfile(user.email, 'user');

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: accessProfile.role,
          isSuperAdmin: accessProfile.isSuperAdmin,
          avatar: user.avatar,
          avatarUrl: user.getAvatarUrl(),
          avatarType: user.avatar?.type,
          bio: user.bio,
          isPremium: user.isPremium || false,
          skillsOffering: user.skillsOffering,
          skillsSeeking: user.skillsSeeking,
          rating: user.rating,
          totalSessions: user.totalSessions,
          badges: user.badges,
          joinDate: user.createdAt,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

};

module.exports = authController;
