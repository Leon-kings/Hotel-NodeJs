const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Token generation function (used during login/registration)
const generateToken = (userId, isAdmin = false) => {
  return jwt.sign(
    { userId, isAdmin },
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
      success: false,
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
        success: false,
        status: "failed",
        message: "User account not found"
      });
    }

    // 5. Check password change timestamp
    if (currentUser.passwordChangedAt && 
        decoded.iat < Math.floor(currentUser.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({
        success: false,
        status: "failed",
        message: "Password was changed. Please log in again."
      });
    }

    // 6. Attach user to request
    req.user = {
      _id: currentUser._id,
      email: currentUser.email,
      isAdmin: currentUser.isAdmin || false
    };
    
    // 7. Token rotation (optional security practice)
    const newToken = generateToken(currentUser._id, currentUser.isAdmin);
    res.setHeader('Authorization', `Bearer ${newToken}`);
    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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
      success: false,
      status: "failed",
      message,
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

// Admin-only middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized. Admin access required.'
    });
  }
  next();
};

// Optional: Email verification middleware
const verifiedEmailMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before accessing this resource.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking email verification status'
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  verifiedEmailMiddleware,
  generateToken
};