const express = require("express");
const app = express();
const path = require("path");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const flash = require("connect-flash");
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

// Setup passport to use the User model
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Connect to MongoDB
let gfs; // Declare gfs outside mongoose connection

mongoose
  .connect(process.env.MONGO_URI)
  .then((connection) => {
    console.log("Connected to MongoDB");
    const db = connection.connection.db;
    gfs = new mongoose.mongo.GridFSBucket(db, { bucketName: "fs" });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/", authRoutes);
app.use("/users", photoRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
