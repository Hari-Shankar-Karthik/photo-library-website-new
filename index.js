const express = require("express");
const app = express();
const path = require("path");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const flash = require("connect-flash");
const methodOverride = require("method-override");
require("dotenv").config();

// Models
const User = require("./models/user");

// Routes
const authRoutes = require("./routes/auth");
const photoRoutes = require("./routes/photos");

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// EJS setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "dangthisisnotsecure",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.user = req.user;
    next();
});
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// Setup passport to use the User model
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Connect to MongoDB
mongoose
    .connect("mongodb://localhost:27017/photo-library")
    .then(console.log("Connected to MongoDB"))
    .catch((err) => console.error(err));

// Routes
app.use("/", authRoutes);
app.use("/users", photoRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
