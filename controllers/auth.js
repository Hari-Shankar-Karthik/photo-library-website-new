const User = require("../models/user");

const auth = {};

auth.registerForm = (req, res) => {
  res.render("auth/register");
};

auth.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    await User.register(user, password);
    req.flash("success", "Registered successfully! Please login.");
    res.redirect("/login");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/register");
  }
};

auth.loginForm = (req, res) => {
  res.render("auth/login");
};

auth.login = (req, res) => {
  req.flash("success", "Welcome back!");
  res.redirect(`/users/${req.user._id}`);
};

auth.logout = (req, res) => {
  req.logout();
  req.flash("success", "Logged out successfully!");
  res.redirect("/login");
};

module.exports = auth;
