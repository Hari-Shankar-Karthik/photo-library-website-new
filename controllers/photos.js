const mongoose = require("mongoose");
const User = require("../models/user");
const Image = require("../models/image");

module.exports.index = async (req, res) => {
    const { userID } = req.params;
    const user = await User.findById(userID).populate("images");
    console.log(user);
    res.render("photos/index", { user });
};

module.exports.new = async (req, res) => {
    const { userID } = req.params;
    const user = await User.findById(userID).populate("images");
    res.render("photos/new", { user });
};

module.exports.upload = async (req, res) => {
    const { imageURL } = req.body;

    // Retrieve the user document from the database
    const { userID } = req.params;
    const user = await User.findById(userID).populate("images");

    if (imageURL) {
        // Create a new image document
        const image = new Image({ url: imageURL });
        await image.save();
        // Save the image URL to the user's images array
        user.images.push(image);
    } else {
        // Image files have been uploaded
        const imageURLs = req.files.map((file) => file.path);
        console.log(imageURLs);
        // Create new image documents
        const images = imageURLs.map((url) => new Image({ url }));
        await Image.insertMany(images);
        console.log(images);
        // Save the image URLs to the user's images array
        user.images.push(...images);
    }

    // Save the user's images array to the database
    await user.save();

    // Flash success message
    req.flash("success", "Image upload successful!");

    // Redirect to the user's profile page
    res.redirect(`/users/${userID}`);
};

module.exports.delete = async (req, res) => {
    const { userID, imageID } = req.params;

    // Remove the image from the images collection
    await Image.findByIdAndDelete(imageID);

    // Remove the image from the user's images array
    await User.findByIdAndUpdate(userID, {
        $pull: { images: imageID },
    });

    // Flash success message
    req.flash("success", "Image deleted successfully");

    // Redirect to the user's profile page
    res.redirect(`/users/${userID}`);
};

module.exports.results = async (req, res) => {
    const { search_query } = req.query;
    const { userID } = req.params;

    try {
        // Retrieve the user's embeddings file from the database
        const user = await User.findById(userID);
        // TODO: Make API call with search_query and user.images
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch prediction" });
    }
};
