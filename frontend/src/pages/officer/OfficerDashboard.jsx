import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Hourglass, CheckCircle2, MapPin, Search, Eye, Filter, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import SkeletonLoader from '../../components/SkeletonLoader';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Active'); // Active vs Resolved vs All
  const [search, setSearch] = useState('');

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      // In backend, we query complaints where assignedOfficer = user.id
      const response = await api.get('/complaints');
      if (response.data.success) {
        // Filter local response by current officer
        const officerTickets = response.data.complaints.filter(c => 
          c.assignedOfficer?._id === user.id
        );
        setComplaints(officerTickets);
      }
    } catch (err) {
      console.error('Error fetching assigned complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, [user]);

  // Compute stats
  const totalAssigned = complaints.length;
  const inProgress = complaints.filter(c => ['Accepted', 'In Progress'].includes(c.status)).length;
  const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  // Filter list
  const filteredComplaints = complaints.filter(c => {
    // Search keyword match
    const matchesSearch = 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter matches
    if (statusFilter === 'Active') {
      return ['Assigned', 'Accepted', 'In Progress'].includes(c.status);
    }
    if (statusFilter === 'Resolved') {
      return ['Resolved', 'Closed'].includes(c.status);
    }
    if (statusFilter === 'Rejected') {
      return c.status === 'Rejected';
    }
    return true; // All
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-500';
      case 'Accepted':
        return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-500';
      case 'In Progress':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-500';
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-500';
      default: // Rejected
        return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome header & sector block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Officer Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assigned complaints, status progressions, and district repairs center.
          </p>
        </div>

        {/* Sector info card */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-darkbg-800 border border-slate-100 dark:border-slate-800 shadow-sm text-xs text-slate-700 dark:text-slate-350">
          <MapPin className="h-4.5 w-4.5 text-brand-500 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Sector</p>
            <p className="font-semibold">{user.sector || 'No Sector'}</p>
          </div>
        </div>
      </div>

      {/* Stats summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <>
            <DashboardCard
              title="Total Assigned"
              value={totalAssigned}
              icon={<ClipboardList className="h-6 w-6" />}
              colorClass="brand"
              trendText="Lifetime assigned assignments"
            />
            <DashboardCard
              title="Work In Progress"
              value={inProgress}
              icon={<Hourglass className="h-6 w-6" />}
              colorClass="warning"
              trendText="Active crew allocations"
            />
            <DashboardCard
              title="Resolved Tickets"
              value={resolved}
              icon={<CheckCircle2 className="h-6 w-6" />}
              colorClass="success"
              trendText="Successful restorations"
            />
          </>
        )}
      </div>

      {/* Filters & Search feed */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white">
            Assigned Tasks
          </h2>

          <div className="w-full md:w-auto flex flex-wrap gap-2">
            
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white dark:bg-darkbg-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-xs"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-200/50 dark:bg-darkbg-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('Active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'Active' ? 'bg-white dark:bg-darkbg-700 text-brand-655 font-bold shadow-sm' : 'text-slate-500'}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('Resolved')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'Resolved' ? 'bg-white dark:bg-darkbg-700 text-brand-655 font-bold shadow-sm' : 'text-slate-500'}`}
              >
                Resolved
              </button>
              <button
                onClick={() => setStatusFilter('Rejected')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'Rejected' ? 'bg-white dark:bg-darkbg-700 text-brand-655 font-bold shadow-sm' : 'text-slate-500'}`}
              >
                Rejected
              </button>
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'All' ? 'bg-white dark:bg-darkbg-700 text-brand-655 font-bold shadow-sm' : 'text-slate-500'}`}
              >
                All
              </button>
            </div>

          </div>
        </div>

        {/* Assignments Cards list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonLoader count={2} />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="card-premium p-10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-3.5 rounded-full bg-slate-50 dark:bg-darkbg-700 text-slate-400 border border-slate-100 dark:border-slate-800">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">No assigned tickets found</p>
              <p className="text-xs text-slate-450 dark:text-slate-500">
                You have no tasks matching the "{statusFilter}" status filter. Enjoy the clean queue!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredComplaints.map(complaint => (
              <div 
                key={complaint._id}
                className="card-premium flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 border border-brand-100/30">
                      {complaint.category?.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusBadge(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-slate-805 text-slate-800 dark:text-white line-clamp-1">
                      {complaint.title}
                    </h3>
                    <p className="text-xs text-slate-455 text-slate-500 dark:text-slate-400 line-clamp-2">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-350 shrink-0 mt-0.5" />
                    <span className="truncate">{complaint.address}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-700/20 px-5 py-3.5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Priority: {complaint.severity || 'Medium'} • Reported: {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                  
                  <button
                    onClick={() => navigate(`/complaints/${complaint._id}`)}
                    className="font-semibold text-brand-550 hover:text-brand-700 flex items-center gap-1"
                  >
                    Open Ticket <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default OfficerDashboard;
