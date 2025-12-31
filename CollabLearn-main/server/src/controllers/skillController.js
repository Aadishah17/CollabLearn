const Skill = require('../models/Skill');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Post = require('../models/Post');

// ============= SKILL POSTING METHODS (FOR BROWSE SKILLS MODAL) =============

// Post a skill (update existing skill with posting details)
const postSkill = async (req, res) => {
  try {
    const { title, description, skills: skillName, timePerHour, price } = req.body;
    const userId = req.userId;

    // Input validation
    if (!title || !description || !skillName || !timePerHour) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, skill name, and duration are required'
      });
    }

    // Prepare the update payload
    const updateData = {
      'offering.description': description,
      'offering.duration': timePerHour,
      isPosted: true, // Activate the skill
      'offering.price': 0 // Default price to 0
    };

    // Add subCategory if provided
    if (req.body.subCategory) {
      updateData.subCategory = req.body.subCategory;
    }


    if (price) {
      const parsedPrice = parseFloat(price.replace(/[^\d.]/g, ''));
      if (!isNaN(parsedPrice)) {
        updateData['offering.price'] = parsedPrice;
      }
    }

    // Find the skill and update it atomically
    const updatedSkill = await Skill.findOneAndUpdate(
      { name: skillName, user: userId, isOffering: true }, // Query
      { $set: updateData }, // Update
      { new: true, runValidators: true } // Options
    );

    if (!updatedSkill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found. Please add this skill to your profile first.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Skill has been posted and is now active.',
      data: updatedSkill
    });

  } catch (error) {
    console.error('Post skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill posting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============= SKILL OFFERING METHODS =============

// Add a new skill offering
const addSkillOffering = async (req, res) => {
  try {
    const { name, level, description, category, subCategory, tags, duration, price } = req.body;
    const userId = req.userId;

    // Check if user already offers this skill
    const existingSkill = await Skill.findOne({
      user: userId,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isOffering: true
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'You are already offering this skill'
      });
    }

    // Create new skill with isPosted set to false.
    // Skills are not posted until the user does so from the browse skills page.
    const newSkill = new Skill({
      name,
      user: userId,
      isOffering: true,
      isPosted: false, // Skill is not posted by default
      offering: {
        level: level || 'Beginner',
        description: description || '',
        duration: duration || '1 hour',
        price: price || 0
      },
      category: category || 'Other',
      subCategory: subCategory || '',
      tags: tags || []
    });

    await newSkill.save();

    res.status(201).json({
      success: true,
      message: 'Skill offering added successfully',
      skill: newSkill
    });

  } catch (error) {
    console.error('Add skill offering error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill addition',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update skill offering
const updateSkillOffering = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { level, description, duration, price } = req.body;
    const userId = req.userId;

    const skill = await Skill.findOne({ _id: skillId, user: userId, isOffering: true });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill offering not found'
      });
    }

    // Update offering fields
    if (level) skill.offering.level = level;
    if (description !== undefined) skill.offering.description = description;
    if (duration) skill.offering.duration = duration;
    if (price !== undefined) skill.offering.price = price;

    await skill.save();

    res.json({
      success: true,
      message: 'Skill offering updated successfully',
      skill
    });

  } catch (error) {
    console.error('Update skill offering error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete skill offering
const deleteSkillOffering = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.userId;

    const skill = await Skill.findOne({ _id: skillId, user: userId, isOffering: true });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill offering not found'
      });
    }

    // If skill is both offering and seeking, just remove offering
    if (skill.isSeeking) {
      skill.isOffering = false;
      skill.offering = undefined;
      await skill.save();
    } else {
      // If only offering, delete the entire skill
      await Skill.findByIdAndDelete(skillId);
    }

    res.json({
      success: true,
      message: 'Skill offering removed successfully'
    });

  } catch (error) {
    console.error('Delete skill offering error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============= SKILL SEEKING METHODS =============

// Add a new skill seeking
const addSkillSeeking = async (req, res) => {
  try {
    const { name, preferredSchedule, category, subCategory, tags } = req.body;
    const userId = req.userId;

    // Check if user already seeks this skill
    const existingSkill = await Skill.findOne({
      user: userId,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') },
      isSeeking: true
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'You are already seeking this skill'
      });
    }

    const newSkill = new Skill({
      name,
      user: userId,
      isSeeking: true,
      seeking: {
        preferredSchedule: preferredSchedule || []
      },
      category: category || 'Other',
      subCategory: subCategory || '',
      tags: tags || []
    });

    await newSkill.save();

    res.status(201).json({
      success: true,
      message: 'Skill seeking added successfully',
      skill: newSkill
    });

  } catch (error) {
    console.error('Add skill seeking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill addition',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update skill seeking
const updateSkillSeeking = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { progress, preferredSchedule } = req.body;
    const userId = req.userId;

    const skill = await Skill.findOne({ _id: skillId, user: userId, isSeeking: true });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill seeking not found'
      });
    }

    // Update seeking fields
    if (progress !== undefined) skill.updateProgress(progress);
    if (preferredSchedule) skill.seeking.preferredSchedule = preferredSchedule;

    await skill.save();

    res.json({
      success: true,
      message: 'Skill seeking updated successfully',
      skill
    });

  } catch (error) {
    console.error('Update skill seeking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete skill seeking
const deleteSkillSeeking = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.userId;

    const skill = await Skill.findOne({ _id: skillId, user: userId, isSeeking: true });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill seeking not found'
      });
    }

    // If skill is both offering and seeking, just remove seeking
    if (skill.isOffering) {
      skill.isSeeking = false;
      skill.seeking = undefined;
      await skill.save();
    } else {
      // If only seeking, delete the entire skill
      await Skill.findByIdAndDelete(skillId);
    }

    res.json({
      success: true,
      message: 'Skill seeking removed successfully'
    });

  } catch (error) {
    console.error('Delete skill seeking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skill deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============= GENERAL SKILL METHODS =============

// Get user's skills
const getUserSkills = async (req, res) => {
  try {
    const userId = req.userId;

    // Get ALL user skills regardless of isActive status for ProfilePage display
    // Populate currentInstructor to get instructor's name instead of just ID
    const skills = await Skill.find({ user: userId })
      .populate('seeking.currentInstructor', 'name email')
      .sort({ createdAt: -1 });

    const skillsOffering = skills.filter(skill => skill.isOffering);
    const skillsSeeking = skills.filter(skill => skill.isSeeking);

    res.json({
      success: true,
      data: {
        skillsOffering,
        skillsSeeking,
        totalSkills: skills.length
      }
    });

  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching skills'
    });
  }
};

// Search skills
const searchSkills = async (req, res) => {
  try {
    const { q, category, level, type = 'offering' } = req.query;

    let query = { isPosted: true };

    if (type === 'offering') {
      query.isOffering = true;
    } else if (type === 'seeking') {
      query.isSeeking = true;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (level && type === 'offering') {
      query['offering.level'] = level;
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'offering.description': { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    const skills = await Skill.find(query)
      .populate('user', 'name rating')
      .sort({ createdAt: -1 })
      .limit(50);

    // Debug: Log the populated user data and process avatars
    console.log('Found skills with user data:', skills.map(skill => ({
      skillName: skill.name,
      userName: skill.user?.name,
      userAvatarUrl: skill.user?.getAvatarUrl?.() || null,
      userAvatarType: skill.user?.avatar?.type,
      userId: skill.user?._id
    })));

    // Process skills to include computed avatar URLs
    const processedSkills = skills.map(skill => {
      const skillObj = skill.toObject();
      if (skillObj.user && skill.user.getAvatarUrl) {
        skillObj.user.avatarUrl = skill.user.getAvatarUrl();
        skillObj.user.avatarType = skill.user.avatar?.type;
      }
      return skillObj;
    });

    res.json({
      success: true,
      data: processedSkills,
      count: processedSkills.length
    });

  } catch (error) {
    console.error('Search skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
};

// Get skill categories
const getSkillCategories = async (req, res) => {
  try {
    const categories = await Skill.distinct('category', { isPosted: true });

    res.json({
      success: true,
      categories: categories.sort()
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};

// Get all distinct skill names
const getAllSkillNames = async (req, res) => {
  try {
    const skillNames = await Skill.distinct('name', { isPosted: true });

    res.json({
      success: true,
      skillNames: skillNames.sort()
    });

  } catch (error) {
    console.error('Get skill names error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching skill names'
    });
  }
};

// ============= ADVANCED RECOMMENDATION SYSTEM =============
const recommendationService = require('../services/recommendationService');

const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const result = await recommendationService.getPersonalizedRecommendations(userId, limit);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating recommendations'
    });
  }
};

module.exports = {
  // Skill Posting (Browse Skills Modal)
  postSkill,

  // Skill Offering
  addSkillOffering,
  updateSkillOffering,
  deleteSkillOffering,

  // Skill Seeking
  addSkillSeeking,
  updateSkillSeeking,
  deleteSkillSeeking,

  // General
  getUserSkills,
  searchSkills,
  getSkillCategories,
  getAllSkillNames,

  // Advanced Recommendations
  getPersonalizedRecommendations
};
