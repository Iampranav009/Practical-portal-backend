const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createSubmission,
  getBatchSubmissions,
  updateSubmissionStatus,
  getExploreSubmissions,
  getStudentSubmissions,
  editSubmission,
  deleteSubmission,
  getSubmission,
  getBatchStats
} = require('../controllers/submissionController');

/**
 * Submission Routes
 * Handles all submission-related API endpoints with proper authentication
 * Supports student submission creation and teacher approval/rejection
 */

const router = express.Router();

/**
 * POST /api/submissions/create
 * Create a new submission (students only)
 * Body: { batchId, content, fileUrl? }
 */
router.post('/create', authenticateToken, createSubmission);

/**
 * GET /api/submissions/batch/:batchId
 * Get all submissions for a specific batch
 * Teachers see all, students see accepted + their own
 */
router.get('/batch/:batchId', authenticateToken, getBatchSubmissions);

/**
 * PUT /api/submissions/:submissionId/status
 * Update submission status - accept or reject (teachers only)
 * Body: { status: 'accepted' | 'rejected' }
 */
router.put('/:submissionId/status', authenticateToken, updateSubmissionStatus);

/**
 * GET /api/submissions/explore
 * Get accepted submissions across all batches for explore feed
 * Query params: batchName (optional filter)
 */
router.get('/explore', getExploreSubmissions);

/**
 * GET /api/submissions/my-submissions
 * Get submission history for authenticated student
 * Students only - returns all their submissions with status
 */
router.get('/my-submissions', authenticateToken, getStudentSubmissions);

/**
 * GET /api/submissions/:submissionId
 * Get individual submission by ID
 * Students can only access their own submissions, teachers can access any
 */
router.get('/:submissionId', authenticateToken, getSubmission);

/**
 * PUT /api/submissions/:submissionId/edit
 * Edit a submission (students only, before teacher review)
 * Body: { practicalName, content, fileUrl?, codeSandboxLink? }
 */
router.put('/:submissionId/edit', authenticateToken, editSubmission);

/**
 * DELETE /api/submissions/:submissionId
 * Delete a submission (students only, before teacher review)
 */
router.delete('/:submissionId', authenticateToken, deleteSubmission);

/**
 * GET /api/submissions/batch/:batchId/stats
 * Get statistics for a specific batch
 * Returns enrolled students, total submissions, pending submissions
 */
router.get('/batch/:batchId/stats', authenticateToken, getBatchStats);

module.exports = router;
