const axios = require("axios");
const User = require("../models/user");
const Image = require("../models/image");
const Embedding = require("../models/embedding");

module.exports.index = async (req, res) => {
    const { userID } = req.params;
    const user = await User.findById(userID).populate("images");
    res.render("photos/index", { user });
};

module.exports.new = async (req, res) => {
    const { userID } = req.params;
    const user = await User.findById(userID).populate("images");
    res.render("photos/new", { user });
};

const embedImage = async (imageURL) => {
    try {
        // Make a POST request to the embeddings API
        const response = await axios({
            method: "post",
            url: process.env.EMBEDDINGS_API,
            responseType: "arraybuffer",
            data: { url: imageURL },
            headers: { "Content-Type": "application/json" },
        });

        if (response.status !== 200) {
            throw new Error(
                `Failed to fetch image embedding: ${response.statusText}`
            );
        }

        // Create and save the embedding to the database
        const embedding = new Embedding({ data: response.data });
        await embedding.save();

        // Create and save the corresponding image document
        const image = new Image({ url: imageURL, embedding: embedding._id });
        await image.save();

        return image;
    } catch (err) {
        console.error(err);
    }
};

module.exports.upload = async (req, res) => {
    const { imageURL } = req.body;

    // Retrieve the user document from the database
    const { userID } = req.params;
    const user = await User.findById(userID).populate("images");

    if (imageURL) {
        // Get the embedding of the image
        const image = await embedImage(imageURL);
        // Save the image URL to the user's images array
        user.images.push(image);
    } else {
        for (const file of req.files) {
            // Get the embedding of the image
            const image = await embedImage(file.path);
            // Save the image URL to the user's images array
            user.images.push(image);
        }
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
