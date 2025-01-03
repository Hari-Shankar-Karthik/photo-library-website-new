const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    embedding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Embedding",
    },
});

module.exports = mongoose.model("Image", imageSchema);
