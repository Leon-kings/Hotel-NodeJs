const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

// Generate JWT token function
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

const Authorization = async (req, res, next) => {
  let token;
  try {
    // Extract token from Authorization header, cookie, or localStorage (via header)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    } else {
      token = req.headers.authorization;
    }

    if (!token) {
      return res.status(401).json({ 
        status: "failed",
        message: 'You are not logged in. Please login to continue'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.userId).select('-password');
    if (!currentUser) {
      return res.status(401).json({ 
        status: "failed",
        message: "The user belonging to this token no longer exists"
      });
    }

    // Check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          status: "failed",
          message: "User recently changed password. Please login again"
        });
      }
    }

    // Attach user to request object
    req.user = currentUser;
    
    // Generate new token (optional - for extending session)
    const newToken = generateToken(currentUser._id);
    
    // Send the new token in the response
    res.setHeader('Authorization', `Bearer ${newToken}`);
    res.locals.user = {
      id: currentUser._id,
      email: currentUser.email,
      role: currentUser.role,
      token: newToken  // This will be available to the client
    };

    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: "failed",
        message: "Invalid token. Please login again"
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: "failed",
        message: "Your token has expired. Please login again"
      });
    }
    
    // Generic error handler
    return res.status(500).json({
      status: "failed",
      message: "An error occurred during authentication"
    });
  }
};

module.exports = {
  Authorization,
  generateToken
};