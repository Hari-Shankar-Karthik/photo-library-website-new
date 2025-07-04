const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    images: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Image",
        },
    ],
});

// Adds the username and password fields, with the necessary validations
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
