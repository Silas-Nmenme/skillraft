const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
    params: {
    folder: 'softpire_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'docx'],
    public_id: (req, file) => {
        //Generate unique filename with user ID and timestamp
        const userId = req.user?._id || 'anonymous';
        const timestamp = Date.now();
        return `file_${userId}_${timestamp}`;
    }
    },
});

//File filter function to validate file types
const fileFilter = (req, file, cb) => {
    const allowedMimetypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimetypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image, PDF, and DOCX files are allowed!'), false);
    }
};

//configure multer with Cloudinary storage
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB file size limit
});

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

// Function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
    if (!url) return null;

    // Extract public_id from cloudinary URL
    const matches = url.match(/\/v\d+\/([^\.]+)/);
    return matches ? matches[1] : null;
};

module.exports = {
    cloudinary,
    upload,
    deleteImage,
    extractPublicId,
};