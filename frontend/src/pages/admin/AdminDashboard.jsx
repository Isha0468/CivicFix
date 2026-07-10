import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Users, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  MapPin, 
  Eye, 
  Download, 
  Loader2 
} from 'lucide-react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [categoriesBreakdown, setCategoriesBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const fetchDashboardAnalytics = async () => {
    try {
      const [statsRes, catRes, trendRes, complaintsRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/analytics/category'),
        api.get('/analytics/monthly'),
        api.get('/complaints')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (catRes.data.success) setCategoriesBreakdown(catRes.data.categoryStats);
      if (trendRes.data.success) setTrends(trendRes.data.monthlyStats);
      
      if (complaintsRes.data.success) {
        // Get the top 5 complaints that are 'Reported' or 'Verified' for immediate attention
        const filtered = complaintsRes.data.complaints
          .filter(c => ['Reported', 'Verified'].includes(c.status))
          .slice(0, 5);
        setPendingComplaints(filtered);
      }
    } catch (err) {
      console.error('Failed loading analytics:', err);
      toast.error('Failed to load system metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardAnalytics();
  }, []);

  const handleExportCSV = async () => {
    setDownloadingCsv(true);
    try {
      const response = await api.get('/analytics/export-csv', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `civicfix_complaints_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('CSV Report downloaded successfully!');
    } catch (err) {
      console.error('CSV Export failure:', err);
      toast.error('Failed to compile CSV report.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Chart datasets configuration
  const barChartData = {
    labels: trends.map(t => t.month),
    datasets: [
      {
        label: 'Reported',
        data: trends.map(t => t.reported),
        backgroundColor: 'rgba(253, 208, 23, 0.85)', // gold-accent (#FDD017)
        borderRadius: 8
      },
      {
        label: 'Resolved',
        data: trends.map(t => t.resolved),
        backgroundColor: 'rgba(16, 185, 129, 0.85)', // success-500
        borderRadius: 8
      }
    ]
  };

  const doughnutData = {
    labels: categoriesBreakdown.map(c => c.name),
    datasets: [
      {
        data: categoriesBreakdown.map(c => c.count),
        backgroundColor: [
          '#FDD017', // gold accent first
          '#10b981', // green
          '#f59e0b', // amber
          '#ec4899', // pink
          '#8b5cf6', // purple
          '#64748b', // slate
          '#ef4444', // red
          '#14b8a6', // teal
          '#f97316', // orange
          '#06b6d4', // cyan
          '#a8a29e'  // stone
        ],
        borderWidth: 2,
        borderColor: 'transparent'
      }
    ]
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          font: { size: 10 },
          color: '#94a3b8'
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header and CSV Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            System Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor resolution velocity, department metrics, and export data reports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={downloadingCsv || loading}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/15 disabled:opacity-50 transition-all"
        >
          {downloadingCsv ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Download className="h-4.5 w-4.5" />
          )}
          Export CSV Report
        </button>
      </div>

      {/* KPI Stats summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <SkeletonLoader count={4} />
        ) : (
          <>
            <DashboardCard
              title="Total Complaints"
              value={stats?.totalComplaints || 0}
              icon={<Layers className="h-6 w-6" />}
              colorClass="brand"
              trendText="Total reported issues"
            />
            <DashboardCard
              title="Resolved issues"
              value={stats?.resolvedComplaints || 0}
              icon={<ShieldCheck className="h-6 w-6" />}
              colorClass="success"
              trendText={`Resolution rate: ${stats?.resolutionRate}%`}
            />
            <DashboardCard
              title="Pending Tickets"
              value={stats?.pendingComplaints || 0}
              icon={<TrendingUp className="h-6 w-6" />}
              colorClass="warning"
              trendText="Awaiting action"
            />
            <DashboardCard
              title="Municipal Staff"
              value={stats?.totalOfficers || 0}
              icon={<Users className="h-6 w-6" />}
              colorClass="brand"
              trendText="Active field officers"
            />
          </>
        )}
      </div>

      {/* Graphic Charts breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Bar chart */}
        <div className="card-premium p-6 lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
            6-Month Trends (Reported vs Resolved)
          </h3>
          <div className="h-72">
            {loading ? (
              <SkeletonLoader type="chart" />
            ) : (
              <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
            )}
          </div>
        </div>

        {/* Category division Donut chart */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
            Breakdown by Category
          </h3>
          <div className="h-72 relative">
            {loading ? (
              <SkeletonLoader type="chart" />
            ) : categoriesBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No complaints registered yet.</p>
            ) : (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            )}
          </div>
        </div>

      </div>

      {/* Pending verification queues */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white">
          Awaiting Verification / Unassigned Queue
        </h3>

        {loading ? (
          <div className="card-premium p-6">
            <SkeletonLoader type="table" />
          </div>
        ) : pendingComplaints.length === 0 ? (
          <div className="card-premium p-8 text-center text-xs text-slate-450 dark:text-slate-500">
            No complaints in queue. All complaints verified and assigned!
          </div>
        ) : (
          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80">
                <thead className="bg-slate-50 dark:bg-darkbg-700/50 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-350 bg-white dark:bg-darkbg-800">
                  {pendingComplaints.map(comp => (
                    <tr key={comp._id} className="hover:bg-slate-50/50 dark:hover:bg-darkbg-750/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-805 text-slate-800 dark:text-white">{comp.title}</td>
                      <td className="px-6 py-4">{comp.category?.name}</td>
                      <td className="px-6 py-4 max-w-[200px] truncate">{comp.address}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/10 dark:text-amber-500">
                          {comp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/complaints/${comp._id}`)}
                          className="flex items-center gap-1 font-bold text-brand-500 hover:text-brand-655"
                        >
                          Details <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
