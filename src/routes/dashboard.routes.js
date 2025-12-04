const express = require('express');
const router = express.Router();
const { getDashboard, uploadFile } = require('../controller/dashboard.controller');
const { isAuthenticated } = require('../middlewares/isAuthenticated');
const { uploadAny, upload } = require('../config/cloudinary');

// GET dashboard data
router.get('/dashboard', isAuthenticated, getDashboard);

// POST file upload - uses uploadAny if available, falls back to upload
const fileUploadMiddleware = uploadAny ? uploadAny.single('file') : upload.single('file');
router.post('/dashboard/upload', isAuthenticated, fileUploadMiddleware, uploadFile);

module.exports = router;