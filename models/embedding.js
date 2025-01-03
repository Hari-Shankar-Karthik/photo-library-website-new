const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema({
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
