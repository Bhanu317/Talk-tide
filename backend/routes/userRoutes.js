const express = require("express");
const router = express.Router();
const {
  registerUser,
  authUser,
  allUsers,
  registerVerifiedUser,
  verifyOtp,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(registerUser).get(protect, allUsers);
router.post("/login", authUser);
router.post("/register", registerVerifiedUser);
router.post("/verify-otp", verifyOtp);

module.exports = router;
