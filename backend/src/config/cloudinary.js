const multer = require('multer');
const path = require('path');
const fs = require('fs');

let uploadAvatar;
let uploadComplaintImages;
let deleteFromCloudinary = async (publicId) => { return true; };

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Storage for user avatars
  const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'civicfix/avatars',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 150, height: 150, crop: 'thumb', gravity: 'face' }]
    }
  });

  // Storage for complaint attachments
  const complaintStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'civicfix/complaints',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
  });

  uploadAvatar = multer({ storage: avatarStorage });
  uploadComplaintImages = multer({ storage: complaintStorage });
  
  deleteFromCloudinary = async (imageUrl) => {
    try {
      // Extracts the public ID from Cloudinary URL
      const parts = imageUrl.split('/');
      const filename = parts.pop();
      const folder = parts.slice(parts.indexOf('civicfix')).join('/');
      const publicId = `${folder}/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Cloudinary deletion failed:', error);
      return false;
    }
  };

  console.log('Multer configured to upload directly to Cloudinary.');
} else {
  // Local filesystem fallback
  const baseUploadsDir = path.join(__dirname, '..', '..', 'uploads');
  const avatarDir = path.join(baseUploadsDir, 'avatars');
  const complaintsDir = path.join(baseUploadsDir, 'complaints');

  // Ensure directories exist
  if (!fs.existsSync(baseUploadsDir)) fs.mkdirSync(baseUploadsDir, { recursive: true });
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
  if (!fs.existsSync(complaintsDir)) fs.mkdirSync(complaintsDir, { recursive: true });

  const localAvatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const localComplaintStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, complaintsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and WEBP image files are allowed.'));
    }
  };

  uploadAvatar = multer({ 
    storage: localAvatarStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
  });

  uploadComplaintImages = multer({ 
    storage: localComplaintStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  deleteFromCloudinary = async (imageUrl) => {
    try {
      // In local mode, remove from uploads folder
      if (imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', '..', imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return true;
    } catch (error) {
      console.error('Local file deletion failed:', error);
      return false;
    }
  };

  console.log('Multer configured to upload to local filesystem fallback (uploads directory).');
}

module.exports = {
  uploadAvatar,
  uploadComplaintImages,
  deleteFromCloudinary,
  isCloudinaryConfigured
};
