const express = require('express');
const router = express.Router();
const {
    createModule,
    getModules,
    getModule,
    updateModule,
    deleteModule
} = require('../controllers/moduleController');

const protect = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.route('/')
    .post(protect, createModule)
    .get(optionalAuth, getModules);

router.route('/:id')
    .get(optionalAuth, getModule)
    .put(protect, updateModule)
    .delete(protect, deleteModule);

module.exports = router;
