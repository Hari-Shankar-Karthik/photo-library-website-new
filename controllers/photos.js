const User = require("../models/user");
const axios = require("axios");
const FormData = require("form-data");

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
  const { gfs } = req;
  const { userID } = req.params;
  const imageUrl = req.file.path;

  try {
    console.log("Image URL:", imageUrl);

    // Fetch the user's existing .pth file
    const user = await User.findById(userID);
    const previousFileId = user.embeddingsFile; // GridFS ID of the old file, if it exists

    // Fetch the image from Cloudinary for further processing
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    console.log("Image response: ", imageResponse);

    const formData = new FormData();
    if (previousFileId) {
      // Retrieve the old .pth file from GridFS
      const oldFileStream = gfs.openDownloadStream(previousFileId);
      const oldFileBuffer = await streamToBuffer(oldFileStream); // Convert stream to buffer

      // Add the old .pth file to the form data
      formData.append("old_file", oldFileBuffer, {
        filename: "previous_tensor.pth",
      });
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

    console.log("API response:", apiResponse);

    const newEmbeddingsFile = Buffer.from(apiResponse.data);

    // Upload the new .pth file to GridFS
    const uploadStream = gfs.openUploadStream("embeddings_tensor.pth", {
      metadata: { userID },
    });
    uploadStream.write(newEmbeddingsFile);
    uploadStream.end();

    // Using "finish" to handle the completion of the upload
    uploadStream.on("finish", async () => {
      console.log("New file uploaded");

      // Retrieve the uploaded file's metadata
      const file = await gfs
        .find({ filename: "embeddings_tensor.pth" })
        .toArray();
      if (file.length > 0) {
        const gridFile = file[0];
        console.log("GridFS File ID:", gridFile._id);

        // Update the user's database record with the new file reference
        user.embeddingsFile = gridFile._id;
        user.images.push(imageUrl); // Add the image URL
        await user.save();

        console.log("User updated:", user);

        // Delete the old file from GridFS if it exists
        if (previousFileId) {
          gfs.delete(previousFileId, (err) => {
            if (err) {
              console.error("Error deleting old .pth file:", err);
            } else {
              console.log("Old .pth file deleted successfully");
            }
          });
        }

        // Redirect to the user's photos page
        res.redirect(`/users/${userID}`);
      } else {
        res.status(500).json({ error: "Failed to upload new embeddings file" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
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
