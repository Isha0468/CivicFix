import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, Hourglass, Plus, AlertTriangle, ArrowRight, MapPin } from 'lucide-react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import SkeletonLoader from '../../components/SkeletonLoader';

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonalComplaints = async () => {
      try {
        const response = await api.get('/complaints/my/reports');
        if (response.data.success) {
          setComplaints(response.data.complaints);
        }
      } catch (err) {
        console.error('Failed to load personal complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonalComplaints();
  }, []);

  // Compute card totals
  const totalReported = complaints.length;
  const totalInProgress = complaints.filter(c => ['Verified', 'Assigned', 'Accepted', 'In Progress'].includes(c.status)).length;
  const totalResolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Reported':
      case 'Verified':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-500';
      case 'Assigned':
      case 'Accepted':
      case 'In Progress':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-550';
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-500';
      default: // Rejected
        return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Citizen Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit new civic issues and monitor their status in real time.
          </p>
        </div>
        
        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/15 hover:shadow-brand-500/25 transition-all"
        >
          <Plus className="h-4.5 w-4.5" /> File New Complaint
        </Link>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <>
            <DashboardCard
              title="Complaints Filed"
              value={totalReported}
              icon={<FileText className="h-6 w-6" />}
              colorClass="brand"
              trendText="Total complaints lodged"
            />
            <DashboardCard
              title="In Progress"
              value={totalInProgress}
              icon={<Hourglass className="h-6 w-6" />}
              colorClass="warning"
              trendText="Active investigations"
            />
            <DashboardCard
              title="Issues Resolved"
              value={totalResolved}
              icon={<CheckCircle2 className="h-6 w-6" />}
              colorClass="success"
              trendText="Successful resolutions"
            />
          </>
        )}
      </div>

      {/* My Complaints Listing */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white">
          My Reported Complaints
        </h2>

        {loading ? (
          <div className="card-premium p-6">
            <SkeletonLoader type="table" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="card-premium p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-darkbg-700 text-slate-400">
              <FileText className="h-8 w-8" />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">No complaints reported yet</p>
              <p className="text-xs text-slate-450 dark:text-slate-500">
                Submit your first complaint to draw attention to potholes, broken street lights, or other issues in your locality.
              </p>
            </div>
            <Link
              to="/report"
              className="px-4 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((complaint) => (
              <div 
                key={complaint._id} 
                className="card-premium overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 border border-brand-100/30">
                      {complaint.category?.name}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white line-clamp-1">
                      {complaint.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-350" />
                    <span className="truncate">{complaint.address}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-darkbg-700/20 px-6 py-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Reported on: {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                  
                  <Link
                    to={`/complaints/${complaint._id}`}
                    className="font-semibold text-brand-550 hover:text-brand-700 flex items-center gap-1 group"
                  >
                    Track Progress <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CitizenDashboard;
