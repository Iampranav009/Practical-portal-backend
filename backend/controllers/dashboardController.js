const { pool } = require('../db/connection');

/**
 * Dashboard Controller
 * Handles analytics data aggregation for teacher dashboards
 * Uses optimized queries with joins to avoid performance issues
 */

/**
 * Get teacher analytics and dashboard data
 * Returns overview cards, recent activity, and batch statistics
 */
const getTeacherAnalytics = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Verify the requesting user is the teacher
    if (req.user.role !== 'teacher' || req.user.userId !== parseInt(teacherId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own analytics'
      });
    }

    // Get overview analytics with single optimized query
    const [analyticsRows] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT b.batch_id) as total_batches,
        COUNT(DISTINCT bm.student_id) as total_students,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_submissions,
        COUNT(CASE WHEN s.status = 'accepted' THEN 1 END) as accepted_submissions,
        COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_submissions,
        COUNT(s.submission_id) as total_submissions
      FROM batches b
      LEFT JOIN batch_members bm ON b.batch_id = bm.batch_id
      LEFT JOIN submissions s ON b.batch_id = s.batch_id
      WHERE b.teacher_id = ?
    `, [teacherId]);

    // Get recent submissions activity (last 10)
    const [recentActivityRows] = await pool.execute(`
      SELECT 
        s.submission_id,
        s.content,
        s.status,
        s.created_at,
        s.updated_at,
        u.name as student_name,
        b.name as batch_name,
        b.batch_id
      FROM submissions s
      JOIN users u ON s.student_id = u.user_id
      JOIN batches b ON s.batch_id = b.batch_id
      WHERE b.teacher_id = ?
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [teacherId]);

    // Get submissions trend data for the last 7 days
    const [trendRows] = await pool.execute(`
      SELECT 
        DATE(s.created_at) as submission_date,
        COUNT(s.submission_id) as count,
        COUNT(CASE WHEN s.status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_count
      FROM submissions s
      JOIN batches b ON s.batch_id = b.batch_id
      WHERE b.teacher_id = ? 
        AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(s.created_at)
      ORDER BY submission_date DESC
    `, [teacherId]);

    // Get batch overview with student counts
    const [batchOverviewRows] = await pool.execute(`
      SELECT 
        b.batch_id,
      b.name,
        b.description,
        b.created_at,
        COUNT(DISTINCT bm.student_id) as student_count,
        COUNT(DISTINCT s.submission_id) as submission_count,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_count
      FROM batches b
      LEFT JOIN batch_members bm ON b.batch_id = bm.batch_id
      LEFT JOIN submissions s ON b.batch_id = s.batch_id
      WHERE b.teacher_id = ?
      GROUP BY b.batch_id, b.name, b.description, b.created_at
      ORDER BY b.created_at DESC
    `, [teacherId]);

    const analytics = analyticsRows[0];

    res.json({
      success: true,
      data: {
        overview: {
          totalBatches: analytics.total_batches || 0,
          totalStudents: analytics.total_students || 0,
          pendingSubmissions: analytics.pending_submissions || 0,
          acceptedSubmissions: analytics.accepted_submissions || 0,
          rejectedSubmissions: analytics.rejected_submissions || 0,
          totalSubmissions: analytics.total_submissions || 0
        },
        recentActivity: recentActivityRows,
        submissionTrend: trendRows,
        batchOverview: batchOverviewRows
      }
    });

  } catch (error) {
    console.error('Error fetching teacher analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher analytics'
    });
  }
};

module.exports = {
  getTeacherAnalytics
};
