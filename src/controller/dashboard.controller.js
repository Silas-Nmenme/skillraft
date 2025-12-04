const Founder = require('../models/founder.schema');
const Recruiter = require('../models/recruiter.schema');
const SoloEntrepreneur = require('../models/soloEntrepreneur.schema');
const { upload } = require('../config/cloudinary');

// Helper: find user by ID across all collections
const findUserById = async (userId) => {
  return (
    (await Founder.findById(userId)) ||
    (await Recruiter.findById(userId)) ||
    (await SoloEntrepreneur.findById(userId))
  );
};

// Helper: get counts across collections (similar to auth.controller.js)
const getUserCounts = async () => {
  const founderCount = await Founder.countDocuments();
  const recruiterCount = await Recruiter.countDocuments();
  const soloEntrepreneurCount = await SoloEntrepreneur.countDocuments();
  return {
    totalFounders: founderCount,
    totalRecruiters: recruiterCount,
    totalSoloEntrepreneurs: soloEntrepreneurCount,
    totalUsers: founderCount + recruiterCount + soloEntrepreneurCount
  };
};

const getDashboard = async (req, res) => {
  try {
    // Validate req.user exists
    if (!req.user || !req.user._id) {
      console.error('User not authenticated or missing _id');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.'
      });
    }

    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const userCounts = await getUserCounts();

    let dashboardData = {
      welcome: `Welcome back, ${user.firstName}!`,
      overview: `Here is your overview for this year.`,
      userCounts,
      // Placeholder data since no Course model exists yet
      courses: {
        uploaded: 10, // Static for now
        averageRating: 4.6,
        courseGrowth: '+2',
        workshopGrowth: '+5',
        bestRatedCourse: {
          title: 'Introduction to Web Design',
          rating: 4.6,
          message: 'Your course "Introduction to Web Design" is the best rated course.'
        },
        latestMonths: [
          { month: 'Jan', value: 25 },
          { month: 'Feb', value: 50 },
          { month: 'Mar', value: 75 },
          { month: 'Apr', value: 100 },
          { month: 'May', value: 75 },
          { month: 'Jun', value: 50 }
        ],
        latestCourse: {
          title: 'My Latest Course',
          rating: 4.6,
          uploadDate: '10/02/2024'
        },
        upcomingTracks: [
          {
            title: 'Figma Master Course | From Beginner',
            rating: 4.6,
            uploadDate: '10/02/2024',
            lessons: 20
          },
          {
            title: 'Getting Started with Wireframe',
            rating: 4.6,
            uploadDate: '11/11/2025',
            lessons: 20
          }
        ]
      }
    };

    // Role-specific data
    if (user.role === 'Founder' || user.role === 'Solo Entrepreneur') {
      dashboardData.mentees = 1200;
      dashboardData.reviews = '+10';
      dashboardData.uiDesign = 2000;
      dashboardData.uxDesign = '+10';
    } else if (user.role === 'Recruiter') {
      // For recruiters, perhaps hiring-related placeholders
      dashboardData.hiringNeeds = 12;
      dashboardData.positionsFilled = '+5';
      dashboardData.candidatesReviewed = 4.6; // Placeholder
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message // Remove this in production
    });
  }
};

const uploadFile = async (req, res) => {
  try {
    console.log('uploadFile - req.file:', req.file, 'req.files:', req.files, 'req.body:', req.body);

    // Multer/file-validation surface error (some setups set this)
    if (req.fileValidationError) {
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }

    // Support single, array, and fields-based uploads
    const file =
      req.file ||
      (Array.isArray(req.files) && req.files[0]) ||
      (req.files && Object.values(req.files).flat()[0]);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    // Robust URL extraction for different storage responses
    const fileUrl =
      file.path ||
      file.secure_url ||
      file.url ||
      file.location ||
      file.public_url ||
      file.originalUrl ||
      (Array.isArray(file) && (file[0]?.path || file[0]?.secure_url)) ||
      null;

    // Fallback public id extraction from known fields or from URL
    const extractPublicIdFromUrl = (url) => {
      if (!url) return null;
      const m = url.match(/\/([^\/]+)\.(?:jpg|jpeg|png|gif|mp4|pdf|docx|zip|webp)(?:[?#].*)?$/i);
      if (m) return m[1];
      // cloudinary v#/.../<public_id> pattern
      const m2 = url.match(/\/v\d+\/([^\.\/]+)(?:\.[a-z0-9]+)?$/i);
      return m2 ? m2[1] : null;
    };

    const publicId =
      file.filename ||
      file.public_id ||
      file.publicId ||
      file.key ||
      file.originalname ||
      extractPublicIdFromUrl(fileUrl) ||
      null;

    if (!fileUrl) {
      console.error('Upload middleware did not return a URL for uploaded file', file);
      return res.status(500).json({
        success: false,
        message: 'Upload succeeded but no URL returned by storage provider.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      data: {
        url: fileUrl,
        publicId: publicId
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    // Handle common multer limit error
    if (error && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File too large.' });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  uploadFile
};
