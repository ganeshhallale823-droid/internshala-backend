const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../Model/User");

const router = express.Router();

/* 🔑 PASSWORD GENERATOR (only upper & lower case letters) */
const generatePassword = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

/* USER SIGNUP */
router.post("/signup", async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      phone,
      password: hashedPassword,
    });

    await user.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* USER LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ IMPORTANT CHANGE HERE
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* 🔒 FORGOT PASSWORD (MAIN TASK) */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res
        .status(400)
        .json({ message: "Email or phone is required" });
    }

    const user = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ⏱️ Allow only 1 request per day
    if (user.lastForgotRequest) {
      const last = new Date(user.lastForgotRequest);
      const now = new Date();
      const diffHours = (now - last) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return res.status(400).json({
          message:
            "You can use forgot password only once per day. Please try again later.",
        });
      }
    }

    // 🔐 Generate & update password
    const newPassword = generatePassword(8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.lastForgotRequest = new Date();
    await user.save();

    res.json({
      message: "Password reset successful",
      newPassword,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
