const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    data: {
        type: Buffer,
        required: true,
    },
    contentType: {
        type: String,
        default: "application/octet-stream",
    },
});

module.exports = mongoose.model("Embedding", embeddingSchema);
