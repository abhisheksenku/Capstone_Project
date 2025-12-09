// controllers/userController.js
const User = require("../models/mysql/user");

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
          "updatedAt"
        ]
      }
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
module.exports = {
    fetchProfile
}