import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET /api/profile - Fetch profile for authenticated user (excluding password)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        name,
        email,
        college,
        degree,
        graduation_year,
        skills,
        linkedin,
        github,
        portfolio,
        created_at
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User profile not found',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error.message,
    });
  }
});

// PUT /api/profile - Update profile for authenticated user (password cannot be modified)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      college,
      degree,
      graduation_year,
      skills,
      linkedin,
      github,
      portfolio,
    } = req.body;

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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    let parsedGradYear = null;
    if (graduation_year !== undefined && graduation_year !== null && graduation_year !== '') {
      parsedGradYear = parseInt(graduation_year, 10);
      if (isNaN(parsedGradYear)) {
        return res.status(400).json({
          error: 'Graduation year must be a valid number',
        });
      }
    }

    const query = `
      UPDATE users
      SET
        name = $1,
        email = $2,
        college = $3,
        degree = $4,
        graduation_year = $5,
        skills = $6,
        linkedin = $7,
        github = $8,
        portfolio = $9
      WHERE id = $10
      RETURNING
        id,
        name,
        email,
        college,
        degree,
        graduation_year,
        skills,
        linkedin,
        github,
        portfolio,
        created_at
    `;

    const values = [
      trimmedName,
      trimmedEmail,
      college !== undefined && college !== null && college !== '' ? college.trim() : null,
      degree !== undefined && degree !== null && degree !== '' ? degree.trim() : null,
      parsedGradYear,
      skills !== undefined && skills !== null && skills !== '' ? skills.trim() : null,
      linkedin !== undefined && linkedin !== null && linkedin !== '' ? linkedin.trim() : null,
      github !== undefined && github !== null && github !== '' ? github.trim() : null,
      portfolio !== undefined && portfolio !== null && portfolio !== '' ? portfolio.trim() : null,
      req.userId,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User profile not found',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);

    // Check for PostgreSQL unique constraint violation on email
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This email is already registered to another account',
      });
    }

    res.status(500).json({
      error: 'Failed to update profile',
      details: error.message,
    });
  }
});

export default router;
