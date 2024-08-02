const express = require("express");
const upload = require("../Middlewares/multer");
const {
  requestAccount,
  veirfyOTPAccount,
  registerAccount,
  login,
  forgetPassword,
  verfiyOTPForgetPass,
  setNewPassword,
  editProfile,
  updateUserProfileImage,
} = require("../Controllar/UserControllar");
const auth = require("../Middlewares/auth");
const Router = express.Router();

//users Routes
Router.post("/request-account", requestAccount);
Router.post("/verify-otp-account", veirfyOTPAccount);
Router.post("/register-account", registerAccount);
Router.post("/login", login);
Router.post("/forget-password", forgetPassword);
Router.post("/forgetpassword_otp", verfiyOTPForgetPass);
Router.post("/setnewpassword", setNewPassword);
Router.post("/edit-profile", auth, editProfile);
Router.put(
  "/update-profile-image",
  auth,
  upload.single("image"),
  updateUserProfileImage
);

module.exports = Router;
