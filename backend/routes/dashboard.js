const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getTeacherAnalytics } = require('../controllers/dashboardController');

/**
 * Dashboard API Routes
 * Provides analytics data for teacher dashboards
 * All routes require authentication
 */

const router = express.Router();

// Teacher analytics endpoint
// GET /api/dashboard/teacher/:id
router.get('/teacher/:id', authenticateToken, getTeacherAnalytics);

module.exports = router;
