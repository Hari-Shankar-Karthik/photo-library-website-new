const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const photos = require("../controllers/photos");
const { isLoggedIn } = require("../middleware");

router
    .route("/:userID")
    .get(isLoggedIn, photos.index)
    .post(isLoggedIn, upload.array("images"), photos.upload);

router.get("/:userID/new", isLoggedIn, photos.new);

router.post("/:userID/results", isLoggedIn, photos.results);

// router.delete("/:userID/images/:imageID", isLoggedIn, photos.delete);

module.exports = router;
