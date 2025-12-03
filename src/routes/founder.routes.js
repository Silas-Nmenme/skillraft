const express = require('express');
const router = express.Router();
const { getFounderProfile, updateProfilePage1, updateProfilePage2, updateProfilePage3, updateProfilePage4, updateProfilePage5, updateProfilePage6, uploadProfilePicture, deleteProfilePicture } = require('../controller/founder.controller');
const { isAuthenticated, isFounder } = require('../middlewares/isAuthenticated');
const { upload } = require('../config/cloudinary');


// Protected founder routes
router.get('/profile', isAuthenticated, isFounder, getFounderProfile);
router.put('/update-profile/page1', isAuthenticated, isFounder, updateProfilePage1);
router.put('/update-profile/page2', isAuthenticated, isFounder, updateProfilePage2);
router.put('/update-profile/page3', isAuthenticated, isFounder, updateProfilePage3);
router.put('/update-profile/page4', isAuthenticated, isFounder, updateProfilePage4);
router.put('/update-profile/page5', isAuthenticated, isFounder, updateProfilePage5);
router.put('/update-profile/page6', isAuthenticated, isFounder, updateProfilePage6);

router.post('/upload-profile-picture', isAuthenticated, isFounder, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/delete-profile-picture', isAuthenticated, isFounder, deleteProfilePicture);

module.exports = router;