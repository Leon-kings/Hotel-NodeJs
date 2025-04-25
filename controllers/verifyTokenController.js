const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { generateToken } = require("./authController");

const verifyToken = async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.userId).select("-password");
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: "User belonging to this token no longer exists",
      });
    }

    // Check if user changed password after token was issued
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          error: "User recently changed password. Please login again",
        });
      }
    }

    // Optionally generate new token (refresh token)
    const newToken = generateToken(currentUser._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: currentUser._id,
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status,
        },
        token: newToken, // Send new token if you want to refresh it
      },
    });
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token. Please login again",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Your token has expired. Please login again",
      });
    }

    // Generic error handler
    console.error("Token verification error:", err);
    res.status(500).json({
      success: false,
      error: "An error occurred during token verification",
    });
  }
};
module.exports = { verifyToken };
