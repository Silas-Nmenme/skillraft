const Founder = require('../models/founder.schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/sendEmail');
const { upload, deleteImage, extractPublicId } = require('../config/cloudinary');

const getFounderProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          country: req.user.country,
          state: req.user.state,
          phoneNumber: req.user.phoneNumber,
          role: req.user.role,
          profilePhoto: req.user.profilePhoto,
          currentPosition: req.user.currentPosition,
          areaOfExpertise: req.user.areaOfExpertise,
          skillsAndTech: req.user.skillsAndTech,
          yearsOfExperience: req.user.yearsOfExperience,
          schooling: req.user.schooling,
          whatYouLookingFor: req.user.whatYouLookingFor,
          whatYouCanOffer: req.user.whatYouCanOffer,
          currentProject: req.user.currentProject,
          goalOnPlatform: req.user.goalOnPlatform,
          educationCertifications: req.user.educationCertifications,
          workInternshipExperience: req.user.workInternshipExperience,
          achievementsAwards: req.user.achievementsAwards,
          portfolioWebsite: req.user.portfolioWebsite,
          preferredIndustries: req.user.preferredIndustries,
          availability: req.user.availability,
          preferredCommunicationStyle: req.user.preferredCommunicationStyle,
          shortBio: req.user.shortBio,
          interest: req.user.interest,
          funFact: req.user.funFact,
          profilePicture: req.user.profilePicture
        }
      }
    });
  } catch (error) {
    console.error('Error fetching founder profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

const updateProfilePage1 = async (req, res) => {
  try {
    const { firstName, lastName, profilePhoto, country, state, role } = req.body;

    // Validate required fields for update
    if (!firstName || !lastName || !country || !state || !role) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, country, state, and role are required.'
      });
    }

    // Validate role
    const validRoles = ['Founder', 'Recruiter', 'Solo Entrepreneur'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected.'
      });
    }

    // Update the founder's profile page 1 info
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        profilePhoto,
        country,
        state,
        role,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFounder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data saved.',
      data: {
        user: {
          id: updatedFounder._id,
          firstName: updatedFounder.firstName,
          lastName: updatedFounder.lastName,
          email: updatedFounder.email,
          country: updatedFounder.country,
          state: updatedFounder.state,
          phoneNumber: updatedFounder.phoneNumber,
          role: updatedFounder.role,
          profilePhoto: updatedFounder.profilePhoto
        },
        nextPage: 2
      }
    });
  } catch (error) {
    console.error('Error updating profile page 1:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

const updateProfilePage2 = async (req, res) => {
  try {
    const { currentPosition, areaOfExpertise, skillsAndTech, yearsOfExperience, schooling } = req.body;

    // Validate yearsOfExperience if provided
    if (yearsOfExperience !== undefined && (typeof yearsOfExperience !== 'number' || yearsOfExperience < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Years of experience must be a non-negative number.'
      });
    }

    // Validate skillsAndTech if provided
    if (skillsAndTech) {
      if (!Array.isArray(skillsAndTech)) {
        return res.status(400).json({
          success: false,
          message: 'Skills and tech must be an array of strings.'
        });
      }
      if (!skillsAndTech.every(item => typeof item === 'string')) {
        return res.status(400).json({
          success: false,
          message: 'Skills and tech must be an array of strings.'
        });
      }
    }

    // Update the founder's profile page 2 info
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.user._id,
      {
        currentPosition,
        areaOfExpertise,
        skillsAndTech,
        yearsOfExperience,
        schooling,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFounder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data saved.',
      data: {
        user: {
          id: updatedFounder._id,
          currentPosition: updatedFounder.currentPosition,
          areaOfExpertise: updatedFounder.areaOfExpertise,
          skillsAndTech: updatedFounder.skillsAndTech,
          yearsOfExperience: updatedFounder.yearsOfExperience,
          schooling: updatedFounder.schooling
        },
        nextPage: 3
      }
    });
  } catch (error) {
    console.error('Error updating profile page 2:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

const updateProfilePage3 = async (req, res) => {
  try {
    const { whatYouLookingFor, whatYouCanOffer, currentProject, goalOnPlatform } = req.body;

    // Update the founder's profile page 3 info
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.user._id,
      {
        whatYouLookingFor,
        whatYouCanOffer,
        currentProject,
        goalOnPlatform,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFounder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data saved.',
      data: {
        user: {
          id: updatedFounder._id,
          whatYouLookingFor: updatedFounder.whatYouLookingFor,
          whatYouCanOffer: updatedFounder.whatYouCanOffer,
          currentProject: updatedFounder.currentProject,
          goalOnPlatform: updatedFounder.goalOnPlatform
        },
        nextPage: 4
      }
    });
  } catch (error) {
    console.error('Error updating profile page 3:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

const updateProfilePage4 = async (req, res) => {
  try {
    const { educationCertifications, workInternshipExperience, achievementsAwards, portfolioWebsite } = req.body;

    // Update the founder's profile page 4 info
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.user._id,
      {
        educationCertifications,
        workInternshipExperience,
        achievementsAwards,
        portfolioWebsite,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFounder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data saved.',
      data: {
        user: {
          id: updatedFounder._id,
          educationCertifications: updatedFounder.educationCertifications,
          workInternshipExperience: updatedFounder.workInternshipExperience,
          achievementsAwards: updatedFounder.achievementsAwards,
          portfolioWebsite: updatedFounder.portfolioWebsite
        },
        nextPage: 5
      }
    });
  } catch (error) {
    console.error('Error updating profile page 4:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

const updateProfilePage5 = async (req, res) => {
  try {
    const { preferredIndustries, availability, preferredCommunicationStyle } = req.body;

    // Update the founder's profile page 5 info
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.user._id,
      {
        preferredIndustries,
        availability,
        preferredCommunicationStyle,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFounder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data saved.',
      data: {
        user: {
          id: updatedFounder._id,
          preferredIndustries: updatedFounder.preferredIndustries,
          availability: updatedFounder.availability,
          preferredCommunicationStyle: updatedFounder.preferredCommunicationStyle
        },
        nextPage: 6
      }
    });
  } catch (error) {
    console.error('Error updating profile page 5:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

const updateProfilePage6 = async (req, res) => {
  try {
    const { shortBio, interest, funFact } = req.body;

    // Update the founder's profile page 6 info
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.user._id,
      {
        shortBio,
        interest,
        funFact,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFounder) {
      return res.status(404).json({
        success: false,
        message: 'Founder not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile page 6 updated successfully.',
      data: {
        user: {
          id: updatedFounder._id,
          shortBio: updatedFounder.shortBio,
          interest: updatedFounder.interest,
          funFact: updatedFounder.funFact
        },
        completionMessage: `
Profile Completed!
Your profile is now complete.
Get ready to explore your
personalized dashboard.`
      }
    });
  } catch (error) {
    console.error('Error updating profile page 6:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Upload Profile Picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const userId = req.user._id;
    const user = await Founder.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if exists
    if (user.profilePicture?.publicId) {
      try {
        await deleteImage(user.profilePicture.publicId);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Update user with new profile picture
    user.profilePicture = {
      url: req.file.path,
      publicId: req.file.filename,
      uploadedAt: new Date()
    };

    // Also update the avatar field for backward compatibility
    user.avatar = req.file.path;

    await user.save();

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: {
        url: user.profilePicture.url,
        uploadedAt: user.profilePicture.uploadedAt
      }
    });

  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Profile Picture
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await Founder.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePicture?.publicId) {
      return res.status(400).json({ message: "No profile picture to delete" });
    }

    // Delete image from cloudinary
    try {
      await deleteImage(user.profilePicture.publicId);
    } catch (error) {
      console.error('Error deleting profile picture from cloudinary:', error);
      // Continue with removing from DB even if cloudinary deletion fails
    }

    // Remove profile picture from user
    user.profilePicture = undefined;
    user.avatar = undefined;
    await user.save();

    return res.status(200).json({
      message: "Profile picture deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  getFounderProfile,
  updateProfilePage1,
  updateProfilePage2,
  updateProfilePage3,
  updateProfilePage4,
  updateProfilePage5,
  updateProfilePage6,
  uploadProfilePicture,
  deleteProfilePicture
};
