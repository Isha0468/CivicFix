import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, SlidersHorizontal, MapPin, ThumbsUp, MessageSquare, Map as MapIcon, List as ListIcon, Loader2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import ComplaintMap from '../../components/ComplaintMap';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const ComplaintFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [mapCenter, setMapCenter] = useState([40.730610, -73.935242]);
  const [viewMode, setViewMode] = useState('split'); // 'split' (desktop), 'list', 'map' (mobile)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch complaints based on filters
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      if (severity) params.severity = severity;

      const response = await api.get('/complaints', { params });
      if (response.data.success) {
        setComplaints(response.data.complaints);
        
        // Auto-center map on first complaint if available
        if (response.data.complaints.length > 0) {
          const first = response.data.complaints[0];
          if (first.location && first.location.coordinates) {
            const [lng, lat] = first.location.coordinates;
            setMapCenter([lat, lng]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      toast.error('Failed to load complaint feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [category, status, severity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  // Upvote toggle API handler
  const handleUpvote = async (complaintId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (user.role !== 'Citizen') {
      toast.error('Only citizens can upvote complaints.');
      return;
    }

    try {
      const response = await api.post(`/complaints/${complaintId}/upvote`);
      if (response.data.success) {
        const isUpvotedNow = response.data.upvoted;
        setComplaints(prev => prev.map(c => {
          if (c._id === complaintId) {
            // Recalculate upvotes array
            const updatedUpvotes = isUpvotedNow 
              ? [...c.upvotes, user.id] 
              : c.upvotes.filter(id => id !== user.id);
            return { ...c, upvotes: updatedUpvotes };
          }
          return c;
        }));
        toast.success(isUpvotedNow ? 'Upvoted!' : 'Upvote removed');
      }
    } catch (err) {
      console.error('Upvote failure:', err);
      toast.error('Failed to upvote complaint.');
    }
  };

  const selectComplaint = (complaint) => {
    if (complaint.location && complaint.location.coordinates) {
      const [lng, lat] = complaint.location.coordinates;
      setMapCenter([lat, lng]);
      
      // On mobile, automatically switch view to map to show the pin
      if (window.innerWidth < 1024) {
        setViewMode('map');
      }
    }
  };

  const getStatusBadgeColor = (cStatus) => {
    switch (cStatus) {
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
        return 'bg-red-50 text-red-650 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-500';
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkbg-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-premium">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search keyword (e.g. pothole, park, street)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-sm"
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2.5 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white text-sm transition-colors shadow-md shadow-brand-500/10"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-xs font-semibold"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Verified">Verified</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Severity */}
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-xs font-semibold"
          >
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* Reset Filters button */}
          {(category || status || severity || search) && (
            <button
              onClick={() => {
                setCategory('');
                setStatus('');
                setSeverity('');
                setSearch('');
              }}
              className="text-xs font-semibold text-danger-500 px-3 py-2.5 hover:bg-danger-50 dark:hover:bg-danger-900/10 rounded-xl"
            >
              Reset
            </button>
          )}

        </div>
      </div>

      {/* Mobile Tab Selectors */}
      <div className="flex lg:hidden bg-slate-200/50 dark:bg-darkbg-800 p-1 rounded-xl">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' || viewMode === 'split' ? 'bg-white dark:bg-darkbg-700 shadow text-brand-600 dark:text-brand-500' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <ListIcon className="h-4.5 w-4.5" /> List Feed
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'map' ? 'bg-white dark:bg-darkbg-700 shadow text-brand-600 dark:text-brand-500' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <MapIcon className="h-4.5 w-4.5" /> Map View
        </button>
      </div>

      {/* Split/Dual Layout */}
      <div className="flex-1 flex overflow-hidden gap-6">
        
        {/* Left column: Complaints list feed */}
        <div className={`flex-1 lg:flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1 ${viewMode === 'map' ? 'hidden' : 'flex'}`}>
          {loading ? (
            <div className="space-y-4">
              <SkeletonLoader count={3} />
            </div>
          ) : complaints.length === 0 ? (
            <div className="card-premium p-12 flex flex-col items-center justify-center text-center space-y-4">
              <SlidersHorizontal className="h-10 w-10 text-slate-350" />
              <p className="font-semibold text-slate-700 dark:text-slate-350">No complaints match filters</p>
              <p className="text-xs text-slate-450">Try refining your search keyword or clearing filters.</p>
            </div>
          ) : (
            complaints.map(complaint => {
              const hasUpvoted = complaint.upvotes.includes(user?.id);
              return (
                <div
                  key={complaint._id}
                  onClick={() => navigate(`/complaints/${complaint._id}`)}
                  className="card-premium overflow-hidden border-l-4 border-l-brand-500 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 border border-brand-100/30">
                        {complaint.category?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusBadgeColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-base text-slate-800 dark:text-white leading-tight">
                        {complaint.title}
                      </h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-2">
                        {complaint.description}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-350" />
                      <span className="truncate">{complaint.address}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-darkbg-700/25 px-5 py-3 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      By: {complaint.citizen?.name || 'Citizen'} • {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-3">
                      
                      {/* Upvote button */}
                      <button
                        onClick={(e) => handleUpvote(complaint._id, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          hasUpvoted 
                            ? 'bg-brand-500 text-white border-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/10' 
                            : 'bg-white dark:bg-darkbg-800 text-slate-655 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-darkbg-700'
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                        <span>{complaint.upvotes?.length || 0}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/complaints/${complaint._id}`);
                        }}
                        className="flex items-center gap-1 text-brand-500 hover:text-brand-655 font-bold text-[11px]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Right column: Interactive map */}
        <div className={`flex-1 lg:flex ${viewMode === 'list' ? 'hidden' : 'block'} h-full min-h-[300px]`}>
          <ComplaintMap 
            mode="view" 
            complaints={complaints} 
            center={mapCenter} 
            selectedLocation={mapCenter ? { latitude: mapCenter[0], longitude: mapCenter[1], address: 'Focus center' } : null}
          />
        </div>

      </div>
    </div>
  );
};

export default ComplaintFeed;
