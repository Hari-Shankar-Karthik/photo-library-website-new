const axios = require("axios");
const User = require("../models/user");
const Image = require("../models/image");

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

module.exports.upload = async (req, res) => {
    const { userID } = req.params;
    const { imageURL } = req.body;

    try {
        // Send a POST request to get the embedding
        const response = await axios.post(process.env.EMBEDDINGS_API, {
            imageURL,
        });
        const embedding = response.data.embedding;

        if (!embedding || embedding.length !== 512) {
            return res
                .status(500)
                .json({ message: "Invalid embedding generated" });
        }

        // Create a new image document
        const image = new Image({ imageURL, embedding });
        await image.save();

        // Find the user by their ID and push the image to their images array
        const user = await User.findById(userID);
        if (!user) {
            throw new Error("User not found");
        }
        user.images.push(image._id);
        await user.save();

        // Redirect to the user's photos page
        req.flash("success", "Image uploaded successfully");
        res.redirect(`/users/${userID}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error generating embedding" });
    }
};

module.exports.results = async (req, res) => {
    const { userID } = req.params;
    const { searchQuery } = req.body;

    try {
        // Find the user and populate their images
        const user = await User.findById(userID).populate("images");
        if (!user) {
            throw new Error("User not found");
        }

        // Extract the embeddings from the user's images
        const embeddings = user.images.map((image) => image.embedding);

        // Send a POST request to the API to get the results
        const response = await axios.post(process.env.SEARCH_API, {
            searchQuery,
            embeddings,
        });

        // Dummy handling of the response
        const result = response.data.result;
        console.log(`result: ${result}`);
        res.redirect(`/users/${userID}`);
    } catch (err) {
        console.error(`Error generating results: ${err}`);
        res.status(500).json({ message: "Error generating results" });
    }
};
