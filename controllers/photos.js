const mongoose = require("mongoose");
const User = require("../models/user");

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
    console.log(user);
    res.render("photos/index", { user });
};

module.exports.new = async (req, res) => {
    const { userID } = req.params;
    const user = await User.findById(userID);
    res.render("photos/new", { user });
};

module.exports.upload = async (req, res) => {
    const { userID } = req.params;
    const imageURLs = req.files.map((file) => file.path);

    // Save the image URL to the user's images array
    const user = await User.findById(userID);
    user.images.push(...imageURLs);
    await user.save();

    // Redirect to the user's profile page
    res.redirect(`/users/${userID}`);
};

module.exports.results = async (req, res) => {
    const { search_query } = req.query;
    const { userID } = req.params;

    try {
        // Retrieve the user's embeddings file from the database
        const user = await User.findById(userID);
        // Make API call with search_query and user.images
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to fetch prediction" });
    }
};
