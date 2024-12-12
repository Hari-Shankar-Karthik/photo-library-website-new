const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const photos = require("../controllers/photos");
const { isLoggedIn } = require("../middleware");

router
  .route("/:userID")
  .get(isLoggedIn, photos.index)
  .post(isLoggedIn, upload.single("image"), photos.create);

router.get("/:userID/new", isLoggedIn, photos.new);

// router.get("/:userID/results", isLoggedIn, photos.results);

module.exports = router;
