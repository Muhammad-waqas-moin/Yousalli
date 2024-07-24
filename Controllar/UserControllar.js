const randomstring = require("randomstring");
const User = require("../Model/userSchema");
const OTPSchema = require("../Model/OTPSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//generate a random number for otp
const GenerateOTP = () => {
  const newOtp = randomstring.generate({
    length: 4,
    charset: "numeric",
  });
  return newOtp;
};

// check email format
const checkEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
};

// Function to send OTP via email
const sendOTPByEmail = async (email, otp) => {
  // Create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: "engineerwaqas189@gmail.com",
      pass: "pphx jjse btlh kbqv",
    },
  });

  // Verify the transporter
  transporter.verify((error, success) => {
    if (error) {
      console.error("Error verifying transporter:", error);
    } else {
      console.log("Transporter is ready to send emails");
    }
  });
  // Setup email data
  let mailOptions = {
    from: process.env.EMAILUSER,
    to: email, // list of receivers
    subject: "OTP for Verification",
    text: `Your OTP  is ${otp}`,
    // html: '<b>Hello world?</b>' // html body
  };

  // Send email with defined transport object
  let info = await transporter.sendMail(mailOptions);
  console.log("Message sent: %s", info.messageId);
};

const isEmptyOrSpaces = (str) => !str || str.trim() === "";

//////////////////////////////////////////////////////////////////
//controllars

// req account
exports.requestAccount = async (req, res) => {
  try {
    const { email } = req.body;
    checkEmailFormat(email);
    console.log("requestAccount route hits");
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    const otpExists = await OTPSchema.findOne({ identity: email });
    console.log("exists otp ======>", otpExists);
    if (otpExists) {
      await OTPSchema.findByIdAndDelete(otpExists._id);
    }
    const otp = GenerateOTP();
    const newOTP = new OTPSchema({
      identity: email,
      otp: otp,
    });
    console.log("newOTP====>", newOTP);
    await newOTP.save();
    // Send OTP via email
    await sendOTPByEmail(email, otp);
    return res.status(200).json({
      status: "success",
      message: "OTP has been sent to this phone successfully",
      otp: newOTP.otp,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// verify opt for new account
exports.veirfyOTPAccount = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  try {
    checkEmailFormat(email);
    // Check if an OTP exists for the given email
    const otpEntry = await OTPSchema.findOne({ identity: email });
    if (!otpEntry) {
      return res.status(400).json({ message: "OTP not found for this email" });
    }

    // Check if the OTP is valid
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if a user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // OTP is valid and user does not exist, proceed with your logic
    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      email: email,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// register new account
exports.registerAccount = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (
      isEmptyOrSpaces(firstname) ||
      isEmptyOrSpaces(lastname) ||
      isEmptyOrSpaces(email) ||
      isEmptyOrSpaces(password)
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Fields cannot be empty or contain only spaces.",
      });
    }
    checkEmailFormat(email);

    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({
        status: "failed",
        message: `User already registered with this email:${email}`,
      });
    }
    const hashPassword = await bcrypt.hash(password, 8);
    console.log("hashPassword: ", hashPassword);
    const newUser = new User({
      firstname,
      lastname,
      email,
      password: hashPassword,
      profileImage: "",
    });
    await newUser.save();
    return res.status(200).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    console.log("error====>", err);
    return res.status(500).json({
      status: "failed",
      message: err.message,
    });
  }
};

//login user
exports.login = async (req, res) => {
  try {
    console.log("login route hit");
    const { email, password } = req.body;
    if (isEmptyOrSpaces(email) || isEmptyOrSpaces(password)) {
      return res.status(400).json({
        status: "failed",
        message: "email or password must not be empty or spaces",
      });
    }
    checkEmailFormat(email);
    const user = await User.findOne({ email: email });
    console.log("user ========>", user);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.log("error=====>", err);
        return res.status(500).json({
          status: "failed",
          message: err.message,
        });
      }
      if (result) {
        // console.log("result ====>", result);
        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.SCRATEKEY,
          {
            expiresIn: "24h",
          }
        );
        return res.status(200).json({
          status: "success",
          message: "login successfully",
          data: {
            user: user,
            token: token,
          },
        });
      } else {
        return res.status(404).json({
          status: "failed",
          message: "password does not match",
        });
      }
    });
  } catch (err) {
    console.log("error waqas =====>", err);
    return res.status(500).json({
      status: "failed",
      message: err.message,
    });
  }
};

//forgetPassword
exports.forgetPassword = async (req, res, next) => {
  console.log("forget password hit");
  try {
    const { email } = req.body;
    console.log("email====>", email);
    if (isEmptyOrSpaces(email)) {
      return res.status(400).json({
        status: "failed",
        message: "email  must not be empty or spaces",
      });
    }
    checkEmailFormat(email);
    const user = await User.findOne({ email });
    console.log("user======>", user);
    if (!user) {
      return res.status(404).json({
        success: "failed",
        message: "User does not exist",
      });
    }
    // check opt exists and remove first
    const isOtpExists = await OTPSchema.findOne({ identity: email });
    console.log("otp exists ======>", isOtpExists);
    if (isOtpExists) {
      await OTPSchema.findByIdAndDelete(isOtpExists._id);
    }

    //generate new otp
    const otp = GenerateOTP();
    const newOTP = new OTPSchema({
      identity: email,
      otp: otp,
    });
    console.log("newotp====>", newOTP);
    await newOTP.save();
    await sendOTPByEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Just send you OTP, plz verify and set your new password",
      otp: newOTP.otp,
    });
  } catch (err) {
    console.log("error====>", err);
    res.status(500).json({ message: err.message });
  }
};

//verfiy otp for forget password
exports.verfiyOTPForgetPass = async (req, res) => {
  try {
    console.log("verify forgetpass route");
    const { email, otp } = req.body;
    checkEmailFormat(email);
    const otpExists = await OTPSchema.findOne({ identity: email });
    const isUser = await User.findOne({ email: email });
    console.log("otp exist ==>", otpExists);
    if (!isUser) {
      return res.status(400).json({
        status: "failed",
        message: "User Not found",
      });
    }
    if (isUser.email !== otpExists.identity) {
      return res.status(400).json({
        status: "failed",
        message: `requested email is not same`,
      });
    }

    if (otpExists.otp !== otp) {
      return res.status(400).json({
        status: "failed",
        message: `invalid otp`,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Otp Verified successfully",
    });
  } catch (err) {
    console.log("error====>", err);
    return res.status(500).json({ message: err.message });
  }
};

//set new password
exports.setNewPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    checkEmailFormat(email);
    const otpExists = await OTPSchema.findOne({ identity: email });
    console.log("otp exist ==>", otpExists);
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User Not found",
      });
    }
    if (user.email !== otpExists.identity) {
      return res.status(400).json({
        status: "failed",
        message: `requested email is not same`,
      });
    }
    if (otpExists.otp !== otp) {
      return res.status(400).json({
        status: "failed",
        message: `invalid otp`,
      });
    }

    if (newPassword.length >= 8) {
      const hashPassword = await bcrypt.hash(newPassword, 8);
      console.log("hashPassword: ", hashPassword);
      user.password = hashPassword;
      await user.save();
      return res.status(200).json({
        status: "success",
        message: "new password has been set successfully",
        data: {
          user,
        },
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "password must be at least 8 characters",
      });
    }
  } catch (err) {
    console.log("error====>", err);
    return res.status(500).json({ message: err.message });
  }
};
