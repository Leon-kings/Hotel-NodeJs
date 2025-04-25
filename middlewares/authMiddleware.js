const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

// Token generation function (used during login/registration)
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

const authMiddleware = async (req, res, next) => {
  // 1. Extract token from multiple sources
  let token;
  const authHeader = req.headers.authorization;
  const authCookie = req.cookies?.jwt;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (authCookie) {
    token = authCookie;
  } else if (authHeader) { // Fallback for raw token in header
    token = authHeader;
  }

  // 2. Token validation
  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Authentication required. Please log in."
    });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Check user existence
    const currentUser = await User.findById(decoded.userId).select('-password');
    if (!currentUser) {
      return res.status(401).json({
        status: "failed",
        message: "User account not found"
      });
    }

    // 5. Check password change timestamp
    if (currentUser.passwordChangedAt && 
        decoded.iat < Math.floor(currentUser.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({
        status: "failed",
        message: "Password was changed. Please log in again."
      });
    }

    // 6. Attach user to request
    req.user = currentUser;
    
    // 7. Token rotation (optional security practice)
    const newToken = generateToken(currentUser._id);
    res.setHeader('Authorization', `Bearer ${newToken}`);
    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    next();
  } catch (err) {
    // Enhanced error handling
    let message = "Authentication failed";
    let statusCode = 401;

    if (err.name === 'TokenExpiredError') {
      message = "Session expired. Please log in again.";
    } else if (err.name === 'JsonWebTokenError') {
      message = "Invalid authentication token.";
    } else {
      statusCode = 500;
      message = "Authentication error";
    }

    return res.status(statusCode).json({
      status: "failed",
      message,
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

module.exports = {
  authMiddleware,
  generateToken
};