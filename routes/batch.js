const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createBatch,
  getTeacherBatches,
  getBatchDetails,
  joinBatch,
  updateBatch,
  deleteBatch,
  getStudentBatches,
  getAllBatches
} = require('../controllers/batchController');

/**
 * Batch Routes
 * Handles all batch-related API endpoints
 * All routes require authentication
 */

// Teacher routes for batch management
router.post('/create', authenticateToken, createBatch);
router.get('/teacher/my-batches', authenticateToken, getTeacherBatches);
router.put('/edit/:batchId', authenticateToken, updateBatch);
router.delete('/delete/:batchId', authenticateToken, deleteBatch);

// Student routes for batch operations
router.post('/join', authenticateToken, joinBatch);
router.get('/student/my-batches', authenticateToken, getStudentBatches);
router.get('/browse', authenticateToken, getAllBatches);

// Shared routes for batch details
router.get('/:batchId', authenticateToken, getBatchDetails);

module.exports = router;
