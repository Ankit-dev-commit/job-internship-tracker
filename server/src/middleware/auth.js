import jwt from 'jsonwebtoken';

/**
 * Authentication middleware to verify JWT tokens in the Authorization header.
 * Expects: Authorization: Bearer <token>
 * Attaches decoded userId to req.userId upon successful verification.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      error: 'Access denied. No authorization header provided.',
    });
  }

  const parts = authHeader.trim().split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1].trim()) {
    return res.status(401).json({
      error: 'Access denied. Malformed authorization header.',
    });
  }

  const token = parts[1].trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET is not configured in environment variables');
    return res.status(500).json({
      error: 'Internal server configuration error',
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: 'Access denied. Invalid token payload.',
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied. Token has expired.',
      });
    }

    return res.status(401).json({
      error: 'Access denied. Invalid or corrupted token.',
    });
  }
};

export default authenticateToken;
