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
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Yelp Camp!");
      res.redirect(`/users/${user._id}`);
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      req.flash(
        "error",
        `The email "${req.body.email}" is already in use. Please use a different email.`
      );
    } else {
      req.flash("error", err.message);
    }
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
