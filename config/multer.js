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

const upload = multer({ storage });

module.exports = upload;
