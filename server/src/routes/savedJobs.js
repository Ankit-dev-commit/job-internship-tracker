import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET /api/saved-jobs - Return all saved jobs for authenticated user ordered by created_at DESC
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM saved_jobs
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch saved jobs',
      details: error.message,
    });
  }
});

// POST /api/saved-jobs - Create a saved job for authenticated user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      company,
      position,
      job_type,
      location,
      salary,
      job_url,
      deadline,
      notes,
    } = req.body;

    if (!company || !position) {
      return res.status(400).json({
        error: 'Missing required fields: company and position are required.',
      });
    }

    const query = `
      INSERT INTO saved_jobs (
        user_id,
        company,
        position,
        job_type,
        location,
        salary,
        job_url,
        deadline,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `;

    const values = [
      req.userId,
      company,
      position,
      job_type || null,
      location || null,
      salary || null,
      job_url || null,
      deadline || null,
      notes || null,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating saved job:', error);
    res.status(500).json({
      error: 'Failed to create saved job',
      details: error.message,
    });
  }
});

// PUT /api/saved-jobs/:id - Update an existing saved job for authenticated user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company,
      position,
      job_type,
      location,
      salary,
      job_url,
      deadline,
      notes,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid saved job ID',
      });
    }

    if (!company || !position) {
      return res.status(400).json({
        error: 'Missing required fields: company and position are required.',
      });
    }

    const query = `
      UPDATE saved_jobs
      SET
        company = $1,
        position = $2,
        job_type = $3,
        location = $4,
        salary = $5,
        job_url = $6,
        deadline = $7,
        notes = $8
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `;

    const values = [
      company,
      position,
      job_type || null,
      location || null,
      salary || null,
      job_url || null,
      deadline || null,
      notes || null,
      id,
      req.userId,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Saved job not found',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating saved job:', error);
    res.status(500).json({
      error: 'Failed to update saved job',
      details: error.message,
    });
  }
});

// DELETE /api/saved-jobs/:id - Delete a saved job for authenticated user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid saved job ID',
      });
    }

    const query = `
      DELETE FROM saved_jobs
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Saved job not found',
      });
    }

    res.status(200).json({
      message: 'Saved job deleted successfully',
      savedJob: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting saved job:', error);
    res.status(500).json({
      error: 'Failed to delete saved job',
      details: error.message,
    });
  }
});

export default router;
