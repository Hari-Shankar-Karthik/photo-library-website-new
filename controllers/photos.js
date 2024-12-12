const axios = require("axios");
const FormData = require("form-data");
const Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const User = require("../models/user");
const File = require("../models/file"); // I don't know why this is needed but the create API breaks without it

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
  const imageFiles = req.files.images; // Array of images

  try {
    const user = await User.findById(userID).populate("embeddingsFile");
    const previousFileId = user.embeddingsFile?._id; // GridFS ID of the old file, if it exists

    const formData = new FormData();
    if (previousFileId) {
      // Retrieve the old .pth file from GridFS
      const oldFileStream = bucket.openDownloadStream(previousFileId);
      const oldFileBuffer = await streamToBuffer(oldFileStream); // Convert stream to buffer

      // Add the old .pth file to the form data
      formData.append("old_tensor", oldFileBuffer, {
        filename: "previous_tensor.pth",
      });
    }

    // Process all image files
    for (const imageFile of imageFiles) {
      // Fetch image data from local path or URL
      const imageResponse = await axios.get(imageFile.path, {
        responseType: "arraybuffer",
      });

      // Add each image to the form data
      formData.append("file", Buffer.from(imageResponse.data), {
        filename: imageFile.originalname,
      });
    }

    // Send the data to the Python API
    const apiResponse = await axios.post(
      "http://localhost:5000/process",
      formData,
      {
        headers: { ...formData.getHeaders() },
        responseType: "arraybuffer",
      }
    );

    const newEmbeddingsFile = Buffer.from(apiResponse.data);

    // Delete the old .pth file from GridFS if exists
    if (previousFileId) {
      await bucket.delete(previousFileId);
    }

    // Upload the new .pth file to GridFS
    const uniqueFilename = `embeddings_tensor_${Date.now()}.pth`;
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata: { userID },
    });
    uploadStream.write(newEmbeddingsFile);
    uploadStream.end();

    uploadStream.on("finish", async () => {
      // Retrieve the uploaded file's metadata
      const file = await conn.db
        .collection("fs.files")
        .find({ filename: uniqueFilename })
        .toArray();

      if (file.length > 0) {
        const gridFile = file[0];

        // Update the user's database record with the new file reference
        user.embeddingsFile = gridFile._id;

        // Add the new images to the user record
        const newImageUrls = imageFiles.map((img) => img.path);
        user.images.push(...newImageUrls);
        await user.save();

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

module.exports.results = async (req, res) => {
  const { search_query } = req.query;
  const { userID } = req.params;

  try {
    // Retrieve the user's embeddings file from the database
    const user = await User.findById(userID).populate("embeddingsFile");
    const embeddingsFile = user.embeddingsFile;
    // console.log("User found: ", user._id);

    if (!embeddingsFile) {
      return res.status(400).json({ error: "No embeddings file found" });
    }

    // Create a FormData object
    const formData = new FormData();

    // Fetch the user's embeddings file (i.e., the .pth file)
    const embeddingsFileBuffer = await getFileBuffer(embeddingsFile);

    // Append the embeddings file and search query to the form data
    formData.append("old_tensor", embeddingsFileBuffer, {
      filename: "previous_tensor.pth",
    });
    formData.append("search_query", search_query);

    // Make a POST request to the Python Flask API
    const apiResponse = await axios.post(
      "http://localhost:5000/predict",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    console.log("apiResponse status:", apiResponse.statusText);

    // Check for errors in the response
    if (apiResponse.status !== 200) {
      return res.status(500).json({ error: "Error calling prediction API" });
    }

    // Return the images at the indices from the response
    const { indices } = apiResponse.data;
    const images = indices.map((index) => user.images[index]);
    res.render("photos/results", { user, images, search_query });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch prediction" });
  }
};

// Helper function to fetch file buffer from GridFS
async function getFileBuffer(file) {
  const readStream = bucket.openDownloadStream(file._id);
  return new Promise((resolve, reject) => {
    const chunks = [];
    readStream.on("data", (chunk) => chunks.push(chunk));
    readStream.on("end", () => resolve(Buffer.concat(chunks)));
    readStream.on("error", (err) => reject(err));
  });
}
