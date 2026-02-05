const Module = require('../models/Module');
const User = require('../models/User');

// @desc    Create a new module
// @route   POST /api/modules
// @access  Private
exports.createModule = async (req, res) => {
    try {
        const { title, description, content, tags, visibility } = req.body;

        const newModule = await Module.create({
            title,
            description,
            content,
            tags,
            visibility,
            owner: req.userId,
            collaborators: [{ user: req.userId, role: 'editor' }] // Owner is automatically an editor
        });

        res.status(201).json({
            success: true,
            data: newModule
        });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get all public modules
// @route   GET /api/modules
// @access  Public
exports.getModules = async (req, res) => {
    try {
        const query = {
            $or: [
                { visibility: 'public' },
                { owner: req.userId },
                { 'collaborators.user': req.userId }
            ]
        };

        // Simple search
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        const modules = await Module.find(query)
            .populate('owner', 'name avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: modules.length,
            data: modules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Private (if private) / Public (if public)
exports.getModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate('owner', 'name avatar')
            .populate('collaborators.user', 'name avatar');

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        // Access Control
        if (module.visibility === 'private') {
            // Must be owner or collaborator
            if (!req.userId) {
                return res.status(401).json({ success: false, message: 'Please log in to view this module' });
            }

            const isOwner = module.owner._id.toString() === req.userId.toString();
            const isCollaborator = module.collaborators.some(c => c.user._id.toString() === req.userId.toString());

            if (!isOwner && !isCollaborator) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this module' });
            }
        }

        res.status(200).json({
            success: true,
            data: module
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private
exports.updateModule = async (req, res) => {
    try {
        let module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        // Check ownership or editor role
        const isOwner = module.owner.toString() === req.userId.toString();
        const collaborator = module.collaborators.find(c => c.user.toString() === req.userId.toString());
        const isEditor = collaborator && collaborator.role === 'editor';

        if (!isOwner && !isEditor) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this module' });
        }

        module = await Module.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: module
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private
exports.deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        // Only owner can delete
        if (module.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this module' });
        }

        await module.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
