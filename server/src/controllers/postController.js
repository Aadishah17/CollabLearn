const Post = require('../models/Post');
const User = require('../models/User');

const toTrimmedString = (value, maxLength = 200) =>
  String(value || '')
    .trim()
    .slice(0, maxLength);

const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(new Set(tags.map((tag) => toTrimmedString(tag, 32)).filter(Boolean))).slice(
    0,
    8
  );
};

const resolveAvatarUrl = (user, fallbackName) => {
  if (!user?.avatar) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(fallbackName || 'User')}`;
  }

  if (typeof user.avatar === 'string') {
    if (
      user.avatar.startsWith('http://') ||
      user.avatar.startsWith('https://') ||
      user.avatar.startsWith('data:image/')
    ) {
      return user.avatar;
    }
  }

  if (typeof user.avatar === 'object') {
    switch (user.avatar.type) {
      case 'upload':
        return user.avatar.filename
          ? `/uploads/avatars/${user.avatar.filename}`
          : `https://i.pravatar.cc/150?u=${encodeURIComponent(fallbackName || 'User')}`;
      case 'url':
      case 'base64':
        return (
          user.avatar.url ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(fallbackName || 'User')}`
        );
      default:
        break;
    }
  }

  return `https://i.pravatar.cc/150?u=${encodeURIComponent(fallbackName || 'User')}`;
};

const buildAuthorRole = (req) => {
  if (req.isSuperAdmin) {
    return 'Super Admin';
  }

  if (req.userRole === 'admin') {
    return 'Admin';
  }

  return 'Learner';
};

exports.getPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .populate({
          path: 'userId',
          select: 'name email',
          model: 'User',
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({}),
    ]);

    const transformedPosts = posts.map((post) => ({
      ...post,
      userInfo: post.userId
        ? {
            id: post.userId._id,
            name: post.userId.name,
            email: post.userId.email,
          }
        : null,
    }));

    res.json({
      success: true,
      page,
      limit,
      total,
      posts: transformedPosts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTopContributors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    const agg = await Post.aggregate([
      { $group: { _id: '$userId', totalPosts: { $sum: 1 } } },
      { $sort: { totalPosts: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'user.name': { $nin: ['', null] },
          $expr: {
            $not: {
              $regexMatch: { input: { $toLower: '$user.name' }, regex: /^anonymous(\s+user)?$/ },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalPosts: 1,
          name: '$user.name',
          avatar: '',
        },
      },
      { $limit: limit },
    ]);

    const anonRe = /^anonymous(?:\s+user)?$/i;
    const seen = new Set();
    const result = [];

    for (const row of agg) {
      if (!row?.userId || !row?.name || anonRe.test(row.name)) continue;
      const key = row.userId.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        userId: row.userId,
        name: row.name,
        avatar: row.avatar || null,
        avatarUrl: resolveAvatarUrl({ avatar: row.avatar }, row.name),
        totalPosts: row.totalPosts,
      });
    }

    res.json({ success: true, contributors: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  const title = toTrimmedString(req.body?.title, 140);
  const excerpt = toTrimmedString(req.body?.excerpt, 2400);
  const category = toTrimmedString(req.body?.category, 80);
  const tags = sanitizeTags(req.body?.tags);

  if (!title || !excerpt) {
    return res.status(400).json({
      success: false,
      message: 'Title and discussion content are required.',
    });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const author = toTrimmedString(user.name, 80) || 'CollabLearn User';
    const newPost = new Post({
      author,
      avatar: resolveAvatarUrl(user, author),
      title,
      excerpt,
      tags,
      authorRole: buildAuthorRole(req),
      category: category || 'General Discussion',
      userId: req.userId,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isOwner = String(post.userId) === String(req.userId);
    if (!isOwner && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.likePost = async (req, res) => {
  const userId = String(req.userId);

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.likedBy.includes(userId)) {
      post.likedBy.pull(userId);
      post.stats.likes = Math.max(0, (post.stats.likes || 0) - 1);
    } else {
      post.likedBy.push(userId);
      post.stats.likes = (post.stats.likes || 0) + 1;
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  const text = toTrimmedString(req.body?.text, 1200);
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Comment text is required.',
    });
  }

  try {
    const [post, user] = await Promise.all([
      Post.findById(req.params.id),
      User.findById(req.userId).select('name'),
    ]);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    post.comments.push({
      userId: String(req.userId),
      author: toTrimmedString(user.name, 80) || 'CollabLearn User',
      text,
    });
    post.stats.comments = (post.stats.comments || 0) + 1;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
