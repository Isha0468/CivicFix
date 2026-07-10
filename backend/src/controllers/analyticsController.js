const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const User = require('../models/User');

// @desc    Get Admin Dashboard Stats (KPIs)
// @route   GET /api/analytics/stats
// @access  Private/Admin
const getSystemStats = async (req, res, next) => {
  try {
    const totalComplaints = await Complaint.countDocuments({});
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const closedComplaints = await Complaint.countDocuments({ status: 'Closed' });
    const pendingComplaints = await Complaint.countDocuments({ 
      status: { $in: ['Reported', 'Verified', 'Assigned', 'Accepted', 'In Progress'] } 
    });
    const rejectedComplaints = await Complaint.countDocuments({ status: 'Rejected' });

    const totalCitizens = await User.countDocuments({ role: 'Citizen' });
    const totalOfficers = await User.countDocuments({ role: 'Municipal Officer' });

    // Calculate resolution rate
    const resolutionRate = totalComplaints > 0 
      ? Math.round(((resolvedComplaints + closedComplaints) / totalComplaints) * 100) 
      : 0;

    res.json({
      success: true,
      stats: {
        totalComplaints,
        resolvedComplaints: resolvedComplaints + closedComplaints,
        pendingComplaints,
        rejectedComplaints,
        totalCitizens,
        totalOfficers,
        resolutionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Complaint breakdown by Category
// @route   GET /api/analytics/category
// @access  Private/Admin
const getCategoryAnalytics = async (req, res, next) => {
  try {
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: '$categoryDetails'
      },
      {
        $project: {
          _id: 1,
          name: '$categoryDetails.name',
          slug: '$categoryDetails.slug',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({ success: true, categoryStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly complaint trends (Last 6 months)
// @route   GET /api/analytics/monthly
// @access  Private/Admin
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyStats = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          reported: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Map month integers to names
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedStats = monthlyStats.map(stat => {
      const monthIndex = stat._id.month - 1;
      return {
        month: `${months[monthIndex]} ${stat._id.year}`,
        reported: stat.reported,
        resolved: stat.resolved
      };
    });

    res.json({ success: true, monthlyStats: formattedStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Officer Performance Rankings
// @route   GET /api/analytics/officers
// @access  Private/Admin
const getOfficerPerformance = async (req, res, next) => {
  try {
    const officerStats = await Complaint.aggregate([
      {
        $match: {
          assignedOfficer: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedOfficer',
          totalAssigned: { $sum: 1 },
          resolvedCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
            }
          },
          inProgressCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'officerDetails'
        }
      },
      {
        $unwind: '$officerDetails'
      },
      {
        $project: {
          _id: 1,
          name: '$officerDetails.name',
          email: '$officerDetails.email',
          totalAssigned: 1,
          resolvedCount: 1,
          inProgressCount: 1,
          resolutionRate: {
            $cond: [
              { $gt: ['$totalAssigned', 0] },
              { $round: [{ $multiply: [{ $divide: ['$resolvedCount', '$totalAssigned'] }, 100] }, 0] },
              0
            ]
          }
        }
      },
      {
        $sort: { resolutionRate: -1, totalAssigned: -1 }
      }
    ]);

    res.json({ success: true, officerStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Complaints list as CSV
// @route   GET /api/analytics/export-csv
// @access  Private/Admin
const exportCSVReport = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({})
      .populate('citizen', 'name email')
      .populate('category', 'name')
      .populate('assignedOfficer', 'name')
      .sort({ createdAt: -1 });

    let csvContent = 'ID,Title,Category,Status,Severity,Citizen,Assigned Officer,Address,Date Reported,Last Updated\n';

    complaints.forEach(c => {
      const id = c._id.toString();
      const title = `"${c.title.replace(/"/g, '""')}"`;
      const category = c.category ? `"${c.category.name}"` : 'N/A';
      const status = c.status;
      const severity = c.severity;
      const citizen = c.citizen ? `"${c.citizen.name}"` : 'N/A';
      const officer = c.assignedOfficer ? `"${c.assignedOfficer.name}"` : 'Unassigned';
      const address = `"${c.address.replace(/"/g, '""')}"`;
      const dateReported = c.createdAt.toISOString().split('T')[0];
      const lastUpdated = c.updatedAt.toISOString().split('T')[0];

      csvContent += `${id},${title},${category},${status},${severity},${citizen},${officer},${address},${dateReported},${lastUpdated}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=civicfix_complaints_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getCategoryAnalytics,
  getMonthlyAnalytics,
  getOfficerPerformance,
  exportCSVReport
};
