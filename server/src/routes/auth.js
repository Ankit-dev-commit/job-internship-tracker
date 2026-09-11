import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();
const BCRYPT_SALT_ROUNDS = 12;

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Name is required',
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Password is required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user with normalized email already exists
    const existingUserQuery = 'SELECT id FROM users WHERE LOWER(email) = $1';
    const existingUserResult = await pool.query(existingUserQuery, [normalizedEmail]);

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    // Hash password with bcrypt cost factor 12
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const insertQuery = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      trimmedName,
      normalizedEmail,
      hashedPassword,
    ]);

    // Return safe user information (never return password or hash)
    const newUser = insertResult.rows[0];
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error in user registration:', error);

    // Handle unique constraint violation on email
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to register user',
      details: error.message,
    });
  }
});

// POST /api/auth/login - Authenticate user credentials
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Password is required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const query = `
      SELECT id, name, email, password, created_at
      FROM users
      WHERE LOWER(email) = $1
    `;
    const result = await pool.query(query, [normalizedEmail]);

    // If user does not exist, return generic 401 error
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify JWT_SECRET is configured
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured in environment variables');
      return res.status(500).json({
        error: 'Internal server configuration error',
      });
    }

    // Generate JWT token with userId payload and 7-day expiration
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Return token and safe user information only (never return password or hash)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({
      error: 'Failed to log in',
      details: error.message,
    });
  }
});

export default router;
