const express = require('express');
const router = express.Router();
const { getDashboard, uploadFile } = require('../controller/dashboard.controller');
const { isAuthenticated } = require('../middlewares/isAuthenticated');
const { upload } = require('../config/cloudinary');

// Route to get dashboard data
router.get('/dashboard', isAuthenticated, getDashboard);

// Route to upload file
router.post('/dashboard/upload', isAuthenticated, upload.single('file'), uploadFile);

module.exports = router;
