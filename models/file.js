const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({}, { strict: false }); // We don't need to define the full schema; we can use a flexible one.
const File = mongoose.model("fs.files", fileSchema); // Register the fs.files model

module.exports = File;
