const express = require("express");
const router = express.Router();
const passport = require("passport");
const { isLoggedIn } = require("../middleware");
const auth = require("../controllers/auth");

router.route("/register").get(auth.registerForm).post(auth.register);

router
    .route("/login")
    .get(auth.loginForm)
    .post(
        passport.authenticate("local", {
            failureFlash: true,
            failureRedirect: "/login",
        }),
        auth.login
    );

router.post("/logout", isLoggedIn, auth.logout);

module.exports = router;
