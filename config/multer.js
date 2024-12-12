const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "user-images",
    allowed_formats: ["jpg", "jpeg", "png"], // Adjust formats as needed
  },
});

// Set up multer to accept an array of images
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Set a size limit (e.g., 10MB)
}).array("images", 10); // Accept up to 10 files under the name "images"

module.exports = upload;
