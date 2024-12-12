const axios = require("axios");
const FormData = require("form-data");
const Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const User = require("../models/user");
const File = require("../models/file");

// Initialize GridFS stream
const conn = mongoose.createConnection(
  "mongodb://localhost:27017/photo-library"
);
let bucket; // Declare a bucket for GridFS
conn.once("open", () => {
  // Initialize GridFSBucket for writing/uploading
  bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "fs" });
});

module.exports.index = async (req, res) => {
  const { userID } = req.params;
  const user = await User.findById(userID);
  res.render("photos/index", { user });
};

module.exports.new = async (req, res) => {
  const { userID } = req.params;
  const user = await User.findById(userID);
  res.render("photos/new", { user });
};

module.exports.create = async (req, res) => {
  const { userID } = req.params;
  const imageUrl = req.file.path;

  try {
    console.log("Image URL:", imageUrl);

    // Fetch the image from Cloudinary for further processing
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    console.log("Image response status: ", imageResponse.statusText);

    // Fetch the user's record from the database
    const user = await User.findById(userID).populate("embeddingsFile");
    const previousFileId = user.embeddingsFile?._id; // GridFS ID of the old file, if it exists
    console.log("previousFileId:", previousFileId);

    const formData = new FormData();
    if (previousFileId) {
      // Retrieve the old .pth file from GridFS
      const oldFileStream = bucket.openDownloadStream(previousFileId);
      const oldFileBuffer = await streamToBuffer(oldFileStream); // Convert stream to buffer

      // Add the old .pth file to the form data
      formData.append("old_tensor", oldFileBuffer, {
        filename: "previous_tensor.pth",
      });
      console.log("Stored tensor found, ID:", previousFileId);
    } else {
      console.log("No stored tensor found");
    }

    // Add the new image to the form data
    formData.append("file", Buffer.from(imageResponse.data), {
      filename: "uploaded_image.jpg",
    });

    // Send the data to the Python API
    const apiResponse = await axios.post(process.env.PYTHON_API_URL, formData, {
      headers: { ...formData.getHeaders() },
      responseType: "arraybuffer",
    });
    console.log("API response status:", apiResponse.statusText);

    const newEmbeddingsFile = Buffer.from(apiResponse.data);

    // Delete the old .pth file from GridFS
    try {
      if (previousFileId) {
        console.log("Attempting to delete old .pth file, ID:", previousFileId);

        // Use await directly with the delete operation
        await bucket.delete(previousFileId);

        console.log("Old .pth file deleted successfully");
      } else {
        console.log("No old .pth file to delete");
      }
    } catch (deleteError) {
      console.error("Failed to delete old file:", deleteError);
    }

    // Upload the new .pth file to GridFS
    const uniqueFilename = `embeddings_tensor_${Date.now()}.pth`;
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata: { userID },
    });
    uploadStream.write(newEmbeddingsFile);
    uploadStream.end();

    // Using "finish" to handle the completion of the upload
    uploadStream.on("finish", async () => {
      console.log("New file uploaded");

      // Retrieve the uploaded file's metadata
      const file = await conn.db
        .collection("fs.files")
        .find({ filename: uniqueFilename })
        .toArray();

      if (file.length > 0) {
        const gridFile = file[0];
        console.log("GridFS File ID:", gridFile._id);

        // Update the user's database record with the new file reference

        user.embeddingsFile = gridFile._id;
        user.images.push(imageUrl); // Add the image URL
        await user.save();
        console.log("User record updated");

        // Redirect to the user's photos page
        res.redirect(`/users/${userID}`);
      } else {
        res.status(500).json({ error: "Failed to upload new embeddings file" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

// Helper function to convert GridFS stream to buffer
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
}
