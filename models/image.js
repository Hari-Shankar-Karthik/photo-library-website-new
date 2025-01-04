const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    imageURL: { type: String, required: true },
    embedding: { type: [Number], required: true },
});

module.exports = mongoose.model("Image", imageSchema);
