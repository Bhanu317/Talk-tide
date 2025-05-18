const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the details!");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists!");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user!");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

const registerVerifiedUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the details!");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists!");
  }

  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP

  // Store the OTP with the user in the database
  const user = await User.create({
    name,
    email,
    password,
    pic,
    otp, // Save the OTP in the user document
    otpExpires: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
  });

  const message = `Your OTP for email verification is ${otp}. This OTP will expire in 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification OTP",
      message,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      userId: user._id,
    });
    // await user.save();
  } catch (error) {
    user.otp = undefined;
    user.otpExpires = undefined;
    res
      .status(500)
      .json({ success: false, message: "Email could not be sent" });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  console.log("Inside backend", userId, otp);

  const user = await User.findById(userId);
  console.log(user);

  if (!user || user.otp != otp || user.otpExpires < Date.now()) {
    if (!user) console.log("failed on 1");
    if (user.otp !== otp) console.log("failed on 2");
    if (user.otpExpires < Date.now()) console.log("failed on 3");
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  // OTP is correct
  user.otp = undefined; // Clear the OTP
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token: generateToken(user._id), // Generate JWT token if using
  });
});

module.exports = {
  registerUser,
  authUser,
  allUsers,
  registerVerifiedUser,
  verifyOtp,
};
