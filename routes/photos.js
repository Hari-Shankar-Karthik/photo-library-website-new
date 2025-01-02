const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const photos = require("../controllers/photos");
const { isLoggedIn } = require("../middleware");

router
    .route("/:userID")
    .get(isLoggedIn, photos.index)
    .post(isLoggedIn, upload.array("images", 10), photos.upload);

router.get("/:userID/new", isLoggedIn, photos.new);

router.delete("/:userID/images/:imageID", isLoggedIn, photos.delete);

router.get("/:userID/results", isLoggedIn, photos.results);

module.exports = router;
