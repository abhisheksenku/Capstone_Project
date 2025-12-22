// controllers/userController.js
const bcrypt = require("bcrypt");
const User = require("../models/mysql/user");

/* =========================================================
   FETCH PROFILE
========================================================= */
const fetchProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: [
          "password",
          "resetToken",
          "resetTokenExpiry",
          "createdAt",
          "updatedAt",
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("Fetch profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   UPDATE PROFILE (Name, Phone)
========================================================= */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    await User.update(
      { name, phone },
      { where: { id: userId } }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Profile update failed" });
  }
};

/* =========================================================
   UPDATE PASSWORD
========================================================= */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update password error:", err);
    return res.status(500).json({ message: "Password update failed" });
  }
};

/* =========================================================
   DELETE ACCOUNT (SOFT DELETE)
========================================================= */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.update(
      { is_active: false },
      { where: { id: userId } }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ message: "Account deletion failed" });
  }
};

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  fetchProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
};
