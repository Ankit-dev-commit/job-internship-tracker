import express from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET /api/interviews - Return interviews belonging to applications owned by authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT
        i.id,
        i.application_id,
        i.round,
        i.date,
        i.time,
        i.type,
        i.meeting_link,
        i.notes,
        i.result,
        i.created_at,
        a.company,
        a.position
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      WHERE a.user_id = $1
      ORDER BY i.date DESC NULLS LAST, i.time DESC NULLS LAST, i.created_at DESC
    `;
    const result = await pool.query(query, [req.userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({
      error: 'Failed to fetch interviews',
      details: error.message,
    });
  }
});

// POST /api/interviews - Create an interview for an existing application owned by authenticated user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      application_id,
      round,
      date,
      time,
      type,
      meeting_link,
      notes,
      result,
    } = req.body;

    if (!application_id || isNaN(Number(application_id))) {
      return res.status(400).json({
        error: 'Valid application_id is required',
      });
    }

    // Verify that the application exists AND belongs to authenticated user
    const appCheckQuery = `
      SELECT id FROM applications
      WHERE id = $1 AND user_id = $2
    `;
    const appCheckResult = await pool.query(appCheckQuery, [application_id, req.userId]);

    if (appCheckResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Application not found or not accessible',
      });
    }

    const insertQuery = `
      INSERT INTO interviews (
        application_id,
        round,
        date,
        time,
        type,
        meeting_link,
        notes,
        result
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `;

    const values = [
      application_id,
      round || null,
      date || null,
      time || null,
      type || null,
      meeting_link || null,
      notes || null,
      result || null,
    ];

    const insertResult = await pool.query(insertQuery, values);
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({
      error: 'Failed to create interview',
      details: error.message,
    });
  }
});

// PUT /api/interviews/:id - Update an interview belonging to an application owned by authenticated user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      application_id,
      round,
      date,
      time,
      type,
      meeting_link,
      notes,
      result,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid interview ID',
      });
    }

    // Verify that the interview exists and belongs to an application owned by authenticated user
    const interviewCheckQuery = `
      SELECT i.*
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      WHERE i.id = $1 AND a.user_id = $2
    `;
    const interviewCheckResult = await pool.query(interviewCheckQuery, [id, req.userId]);

    if (interviewCheckResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Interview not found or not accessible',
      });
    }

    const existingInterview = interviewCheckResult.rows[0];

    // If new application_id is provided, verify that it also belongs to authenticated user
    let targetAppId = existingInterview.application_id;
    if (application_id !== undefined) {
      if (isNaN(Number(application_id))) {
        return res.status(400).json({
          error: 'Invalid application_id',
        });
      }

      const newAppCheckQuery = `
        SELECT id FROM applications
        WHERE id = $1 AND user_id = $2
      `;
      const newAppCheckResult = await pool.query(newAppCheckQuery, [application_id, req.userId]);

      if (newAppCheckResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Target application not found or not accessible',
        });
      }

      targetAppId = application_id;
    }

    const updateQuery = `
      UPDATE interviews
      SET
        application_id = $1,
        round = $2,
        date = $3,
        time = $4,
        type = $5,
        meeting_link = $6,
        notes = $7,
        result = $8
      WHERE id = $9
      RETURNING *
    `;

    const values = [
      targetAppId,
      round !== undefined ? round : existingInterview.round,
      date !== undefined ? date : existingInterview.date,
      time !== undefined ? time : existingInterview.time,
      type !== undefined ? type : existingInterview.type,
      meeting_link !== undefined ? meeting_link : existingInterview.meeting_link,
      notes !== undefined ? notes : existingInterview.notes,
      result !== undefined ? result : existingInterview.result,
      id,
    ];

    const updateResult = await pool.query(updateQuery, values);
    res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({
      error: 'Failed to update interview',
      details: error.message,
    });
  }
});

// DELETE /api/interviews/:id - Delete an interview belonging to an application owned by authenticated user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid interview ID',
      });
    }

    const deleteQuery = `
      DELETE FROM interviews
      WHERE id = $1
        AND application_id IN (
          SELECT id FROM applications WHERE user_id = $2
        )
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Interview not found or not accessible',
      });
    }

    res.status(200).json({
      message: 'Interview deleted successfully',
      interview: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({
      error: 'Failed to delete interview',
      details: error.message,
    });
  }
});

export default router;
