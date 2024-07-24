const express = require("express");
const {
  requestAccount,
  veirfyOTPAccount,
  registerAccount,
  login,
  forgetPassword,
  verfiyOTPForgetPass,
  setNewPassword,
} = require("../Controllar/UserControllar");
const Router = express.Router();

//Routes
Router.post("/request-account", requestAccount);
Router.post("/verify-otp-account", veirfyOTPAccount);
Router.post("/register-account", registerAccount);
Router.post("/login", login);
Router.post("/forget-password", forgetPassword);
Router.post("/forgetpassword_otp", verfiyOTPForgetPass);
Router.post("/setnewpassword", setNewPassword);
module.exports = Router;
