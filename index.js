const express = require("express");
const app = express();
const path = require("path");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const flash = require("connect-flash");
require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const upload = require("./config/multer");
const Grid = require("gridfs-stream");

// Models
const User = require("./models/user");

// Routes
const authRoutes = require("./routes/auth");

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// EJS setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "dangthisisnotsecure",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.user;
  next();
});
app.use(passport.initialize());
app.use(passport.session());

// Setup passport to use the User model
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Connect to MongoDB
let gfs; // Declare gfs outside mongoose connection

mongoose
  .connect(process.env.MONGO_URI)
  .then((connection) => {
    console.log("Connected to MongoDB");
    const db = connection.connection.db;
    gfs = new mongoose.mongo.GridFSBucket(db, { bucketName: "fs" });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/", authRoutes);

// Home route
app.get("/users/:userID", async (req, res) => {
  const { userID } = req.params;
  const user = await User.findById(userID);
  res.render("photos/index", { user });
});

// Display form to upload image
app.get("/users/:userID/new", async (req, res) => {
  const { userID } = req.params;
  const user = await User.findById(userID);
  res.render("photos/new", { user });
});

// Upload route to handle file storage in GridFS
app.post("/users/:userID", upload.single("image"), async (req, res) => {
  const { userID } = req.params;
  try {
    const imageUrl = req.file.path;
    console.log("Image URL:", imageUrl);

    // Fetch the image from Cloudinary for further processing
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    console.log("Image response: ", imageResponse);

    const formData = new FormData();
    formData.append("file", Buffer.from(imageResponse.data), {
      filename: "uploaded_image.jpg",
    });

    // Send the image to the Python API
    const apiResponse = await axios.post(process.env.PYTHON_API_URL, formData, {
      headers: { ...formData.getHeaders() },
      responseType: "arraybuffer", // Get the .pth file as binary
    });
    console.log("API response:", apiResponse);

    const embeddingsFile = Buffer.from(apiResponse.data);
    console.log("Embeddings file size:", embeddingsFile.length);

    // Use openUploadStream instead of createWriteStream
    const uploadStream = gfs.openUploadStream("embeddings_tensor.pth", {
      metadata: { userID },
    });

    // Write the embeddings file to GridFS
    uploadStream.write(embeddingsFile);
    uploadStream.end();

    // Using 'finish' to handle the completion of the upload
    uploadStream.on("finish", async () => {
      console.log("Upload finished");

      // Retrieve the uploaded file's metadata
      const file = await gfs
        .find({ filename: "embeddings_tensor.pth" })
        .toArray();

      if (file.length > 0) {
        const gridFile = file[0];
        console.log("GridFS File ID:", gridFile._id); // This is now correct
        console.log("File stored in GridFS:", gridFile);

        // Find the user and store the reference to the file in the database
        const user = await User.findById(userID);
        console.log("User found:", user);

        // Store the GridFS file ID reference in the user document
        user.embeddingsFile = gridFile._id; // file._id is already an ObjectId
        await user.save();
        console.log("User updated:", user);

        // Respond with success
        res.status(200).json({
          message: "Image processed and tensor saved successfully in GridFS!",
          cloudinaryUrl: imageUrl,
        });
      } else {
        res
          .status(500)
          .json({ error: "Failed to find uploaded file in GridFS" });
      }
    });
  } catch (error) {
    console.error("Error handling the upload:", error.message || error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
