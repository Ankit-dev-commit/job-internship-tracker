import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET /api/applications - Fetch applications for authenticated user (ordered by newest first)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM applications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: 'Failed to fetch applications',
      details: error.message,
    });
  }
});

// POST /api/applications - Create a new job/internship application
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      company,
      position,
      job_type,
      location,
      salary,
      application_url,
      application_date,
      deadline,
      status,
      notes,
    } = req.body;

    if (!company || !position || !job_type || !status) {
      return res.status(400).json({
        error: 'Missing required fields: company, position, job_type, and status are required.',
      });
    }

    const query = `
      INSERT INTO applications (
        user_id,
        company,
        position,
        job_type,
        location,
        salary,
        application_url,
        application_date,
        deadline,
        status,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE), $9, $10, $11
      ) RETURNING *
    `;

    const values = [
      req.userId,
      company,
      position,
      job_type,
      location || null,
      salary || null,
      application_url || null,
      application_date || null,
      deadline || null,
      status,
      notes || null,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      error: 'Failed to create application',
      details: error.message,
    });
  }
});

// PUT /api/applications/:id - Update an existing application for authenticated user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company,
      position,
      job_type,
      location,
      salary,
      application_url,
      application_date,
      deadline,
      status,
      notes,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid application ID',
      });
    }

    if (!company || !position || !job_type || !status) {
      return res.status(400).json({
        error: 'Missing required fields: company, position, job_type, and status are required.',
      });
    }

    const query = `
      UPDATE applications
      SET
        company = $1,
        position = $2,
        job_type = $3,
        location = $4,
        salary = $5,
        application_url = $6,
        application_date = $7,
        deadline = $8,
        status = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND user_id = $12
      RETURNING *
    `;

    const values = [
      company,
      position,
      job_type,
      location || null,
      salary || null,
      application_url || null,
      application_date || null,
      deadline || null,
      status,
      notes || null,
      id,
      req.userId,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Application not found',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      error: 'Failed to update application',
      details: error.message,
    });
  }
});

// DELETE /api/applications/:id - Delete an application for authenticated user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid application ID',
      });
    }

    const query = `
      DELETE FROM applications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Application not found',
      });
    }

    res.status(200).json({
      message: 'Application deleted successfully',
      application: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      error: 'Failed to delete application',
      details: error.message,
    });
  }
});

export default router;
