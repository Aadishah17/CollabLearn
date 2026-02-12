const User = require('../models/User');
const Post = require('../models/Post');
const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const Setting = require('../models/Setting'); // Import the new Setting model

const adminController = {
  // --- SETTINGS FUNCTIONS ---
  getSettings: async (req, res) => {
    try {
      // Find or create the settings document to ensure it always exists.
      // This "upsert" logic prevents errors on a fresh database.
      let settings = await Setting.findOne({ key: 'main_settings' });
      if (!settings) {
        settings = await new Setting().save();
      }
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  },

  updateSettings: async (req, res) => {
    try {
      const { siteName, maintenanceMode, minPasswordLength, geminiApiKey } = req.body;
      
      // Find the single settings document and update it.
      // The { new: true } option returns the updated document.
      // The { upsert: true } option creates the document if it doesn't exist.
      const updatedSettings = await Setting.findOneAndUpdate(
        { key: 'main_settings' },
        { siteName, maintenanceMode, minPasswordLength, geminiApiKey },
        { new: true, upsert: true, runValidators: true }
      );
      
      res.json({ success: true, message: 'Settings updated successfully', data: updatedSettings });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  },

  // --- EXISTING ADMIN FUNCTIONS ---
  getStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      const activePosts = await Post.countDocuments();
      const reportedPostsCount = await Post.countDocuments({ reports: { $gt: 0 } });

      const instructorSkills = await Skill.find({ isOffering: true }).distinct('user');
      const instructors = instructorSkills.length;
      const learners = totalUsers - instructors;

      // For monthly user registration data
      const monthlyData = await User.aggregate([
        // FIX: Make the match stage more robust.
        // It now ensures createdAt exists, is not null, AND is a valid BSON date type.
        // This prevents errors if some documents have createdAt stored as a string.
        {
          $match: {
            createdAt: { $ne: null, $type: "date" }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            registered: { $sum: 1 },
            // Also calculate active users per month
            active: {
                $sum: {
                    $cond: ["$isActive", 1, 0]
                }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 } // Get up to 12 months of data
      ]);

      const formattedMonthlyData = monthlyData.map(item => ({
        month: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
        registered: item.registered,
        active: item.active
      }));

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          pendingBookings,
          activePosts,
          instructors,
          learners,
          monthlyData: formattedMonthlyData,
          newRequests: 0, // Placeholder
          reportedPostsCount
        }
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin stats',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const skills = await Skill.find({ isOffering: true }).select('user');
        const instructorIds = new Set(skills.map(skill => skill.user.toString()));

        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: instructorIds.has(user._id.toString()) ? 'Instructor' : 'Learner',
            registered: user.createdAt,
            status: user.isActive ? 'Active' : 'Blocked',
            isPremium: user.isPremium || false,
        }));

        res.json({ success: true, data: formattedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  },

  blockUser: async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndUpdate(userId, { isActive: false });
        res.json({ success: true, message: 'User blocked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to block user' });
    }
  },

  unblockUser: async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndUpdate(userId, { isActive: true });
        res.json({ success: true, message: 'User unblocked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to unblock user' });
    }
  },

  updateUserSubscription: async (req, res) => {
    try {
        const { userId } = req.params;
        const { isPremium } = req.body;

        if (typeof isPremium !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: 'isPremium must be a boolean value' 
            });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { isPremium },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: `User subscription updated to ${isPremium ? 'Premium' : 'Free'}`,
            data: user
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user subscription' 
        });
    }
  },
  
  getAllPosts: async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate('userId', 'name')
            .sort({ reports: -1, timestamp: -1 });

        const formattedPosts = posts.map(post => ({
            id: post._id,
            author: post.userId ? post.userId.name : (post.author || 'Unknown'),
            content: post.excerpt || post.title,
            reports: post.reports || 0,
            date: post.timestamp,
        }));

        res.json({ success: true, data: formattedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
  },

  deletePostAsAdmin: async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        await Post.findByIdAndDelete(postId);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
  }
};

module.exports = adminController;

