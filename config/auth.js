const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Configuration
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '1d';
const JWT_SECRET = process.env.JWT_SECRET || '1579ac6e12b88c9d66cd78c07ce0b0222d27338639970466ad7c9cff8cc3ed79ae042670c1efd5bda2c9527b9c75b3944b2afc8d54ca09806a7c353e5e60983e6799f2fc98235a1e23d3e77f753e30933be86f943eb3aaa60f862aa2c3003625a2c8f1e003a90334147ce32c8ecbcc3018c5b65f078e64320905aa8ba1b221276e5b6c5d1e9ef1d9fafbe1e2b34fc0ec5ecba7ea8b962f9a9a3d4b0d9cc26567b127d1e3f3f8e6b8f601a190eabb703ec64254acbc7da7a41fa42488847a1c2491d937ae94f03963fb61a2612b44907d2f67405840cad7faf7db57c7a06b32bdd0f616a79a0880e64f449e84dd03787c628f8b520d5dcfd714f910d8bfeefd49';
const CRYPTO_STRENGTH = 32;

/**
 * Generate random token for email verification
 * @returns {string} Random token
 */
exports.generateRandomToken = () => {
  return crypto.randomBytes(CRYPTO_STRENGTH).toString('hex');
};

/**
 * Generate JWT token for authentication
 * @param {string} id - User/Subscriber ID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
exports.generateJWTToken = (id, email) => {
  return jwt.sign(
    { id, email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<object>} Decoded token payload
 */
exports.verifyJWTToken = promisify(jwt.verify);

/**
 * Create hashed token for verification links
 * @param {string} token - Random token
 * @returns {string} Hashed token
 */
exports.createHashedToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

/**
 * Generate email verification token with expiration
 * @param {string} email - Subscriber email
 * @returns {object} Contains token and expiresAt
 */
exports.generateEmailVerificationToken = () => {
  const token = this.generateRandomToken();
  const hashedToken = this.createHashedToken(token);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration
  
  return {
    token,
    hashedToken,
    expiresAt
  };
};

/**
 * Verify token expiration
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean} True if token is still valid
 */
exports.isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Secure comparison of tokens (timing attack safe)
 * @param {string} token1 
 * @param {string} token2 
 * @returns {boolean} True if tokens match
 */
exports.secureTokenCompare = (token1, token2) => {
  return crypto.timingSafeEqual(
    Buffer.from(token1),
    Buffer.from(token2)
  );
};

/**
 * Generate password reset token (can be used for other systems)
 * @returns {object} Contains token, hashedToken, and expiresAt
 */
exports.generatePasswordResetToken = () => {
  const token = this.generateRandomToken();
  const hashedToken = this.createHashedToken(token);
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiration
  
  return {
    token,
    hashedToken,
    expiresAt
  };
};

/**
 * Generate API key for subscriber (optional)
 * @param {string} email 
 * @returns {string} API key
 */
exports.generateApiKey = (email) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(email + salt + JWT_SECRET)
    .digest('hex');
};

// Middleware for verifying tokens
exports.verifyToken = async (req, res, next) => {
  try {
    // 1) Get token from headers
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = await this.verifyJWTToken(token, JWT_SECRET);

    // 3) Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};