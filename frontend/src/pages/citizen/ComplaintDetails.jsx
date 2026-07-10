import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Calendar, User, UserCheck, ShieldAlert, ArrowLeft, Send, Trash2, CheckCircle2, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../../services/api';
import ComplaintMap from '../../components/ComplaintMap';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Administrative control states
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Officer control states
  const [nextStatus, setNextStatus] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [officerImages, setOfficerImages] = useState([]);
  const [officerPreviews, setOfficerPreviews] = useState([]);
  const [officerLoading, setOfficerLoading] = useState(false);

  // Dialog triggers
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const fetchComplaintDetails = async () => {
    try {
      const response = await api.get(`/complaints/${id}`);
      if (response.data.success) {
        setComplaint(response.data.complaint);
        setComments(response.data.comments);
        
        // Populate default next transition for officer
        const current = response.data.complaint.status;
        if (current === 'Assigned') setNextStatus('Accepted');
        else if (current === 'Accepted') setNextStatus('In Progress');
        else if (current === 'In Progress') setNextStatus('Resolved');
      }
    } catch (err) {
      console.error('Failed to load details:', err);
      toast.error(err.response?.data?.message || 'Complaint details not found.');
      if (user?.role === 'Municipal Officer') {
        navigate('/officer/dashboard');
      } else {
        navigate('/feed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    if (user?.role !== 'Administrator') return;
    try {
      const response = await api.get('/users/officers/list');
      if (response.data.success) {
        setOfficers(response.data.officers);
      }
    } catch (err) {
      console.error('Failed to load officers list:', err);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
    fetchOfficers();
  }, [id, user]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await api.post(`/complaints/${id}/comments`, { text: commentText });
      if (response.data.success) {
        setComments(prev => [...prev, response.data.comment]);
        setCommentText('');
        toast.success('Comment posted');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await api.delete(`/complaints/comments/${commentId}`);
      if (response.data.success) {
        setComments(prev => prev.filter(c => c._id !== commentId));
        toast.success('Comment deleted.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment');
    }
  };

  // Administrative Verify complaint
  const handleAdminVerify = async () => {
    setAdminLoading(true);
    try {
      const response = await api.put(`/complaints/${id}/verify`, { notes: adminNotes });
      if (response.data.success) {
        toast.success('Complaint marked as verified!');
        setAdminNotes('');
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setAdminLoading(false);
    }
  };

  // Administrative Reject complaint
  const handleAdminReject = async () => {
    setAdminLoading(true);
    try {
      const response = await api.put(`/complaints/${id}/reject`, { notes: rejectNotes });
      if (response.data.success) {
        toast.success('Complaint marked as rejected.');
        setRejectNotes('');
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error('Rejection failed');
    } finally {
      setAdminLoading(false);
    }
  };

  // Administrative Close complaint
  const handleAdminClose = async () => {
    setAdminLoading(true);
    try {
      const response = await api.put(`/complaints/${id}/close`, { notes: closeNotes });
      if (response.data.success) {
        toast.success('Complaint marked as closed.');
        setCloseNotes('');
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error('Closure failed');
    } finally {
      setAdminLoading(false);
    }
  };

  // Administrative Assign Officer
  const handleAdminAssign = async (e) => {
    e.preventDefault();
    if (!selectedOfficer) {
      toast.error('Please select an officer.');
      return;
    }

    setAdminLoading(true);
    try {
      const response = await api.put(`/complaints/${id}/assign`, {
        officerId: selectedOfficer,
        notes: assignNotes
      });
      if (response.data.success) {
        toast.success('Officer assigned successfully!');
        setSelectedOfficer('');
        setAssignNotes('');
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error('Assignment failed');
    } finally {
      setAdminLoading(false);
    }
  };

  // Officer status/timeline update
  const handleOfficerUpdate = async (e) => {
    e.preventDefault();
    if (!nextStatus) return;

    setOfficerLoading(true);
    const formData = new FormData();
    formData.append('status', nextStatus);
    formData.append('notes', officerNotes);
    
    officerImages.forEach(img => {
      formData.append('images', img);
    });

    try {
      const response = await api.put(`/complaints/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success(`Timeline status progressed to: ${nextStatus}`);
        setOfficerNotes('');
        setOfficerImages([]);
        setOfficerPreviews([]);
        fetchComplaintDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed.');
    } finally {
      setOfficerLoading(false);
    }
  };

  const handleOfficerFiles = (e) => {
    const files = Array.from(e.target.files);
    setOfficerImages(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setOfficerPreviews(prev => [...prev, ...previews]);
  };

  // Citizen deletes the complaint (only before verification)
  const handleCitizenDelete = async () => {
    try {
      const response = await api.delete(`/complaints/${id}`);
      if (response.data.success) {
        toast.success('Complaint deleted successfully.');
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!complaint) return null;

  const isCitizenOwner = complaint.citizen?._id === user?.id;
  const isAssignedOfficer = complaint.assignedOfficer?._id === user?.id;
  const isAdmin = user?.role === 'Administrator';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <button
          onClick={() => {
            if (user?.role === 'Municipal Officer') navigate('/officer/dashboard');
            else if (user?.role === 'Administrator') navigate('/admin/dashboard');
            else navigate('/feed');
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-750 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {isCitizenOwner && complaint.status === 'Reported' && (
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-danger-500 hover:bg-danger-600 transition-colors shadow-sm"
          >
            Delete Complaint
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: details and comments */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Details card */}
          <div className="card-premium p-6 space-y-5">
            <div className="flex justify-between items-start gap-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 border border-brand-100/30">
                {complaint.category?.name}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-darkbg-700 text-slate-600 dark:text-slate-350">
                {complaint.status}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                Complaint ID: {complaint._id}
              </p>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
                {complaint.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> By: {complaint.citizen?.name || 'Citizen'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Reported on: {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" /> Severity: {complaint.severity}
                </span>
                {complaint.assignedOfficer && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-brand-500" /> Assigned: {complaint.assignedOfficer.name} ({complaint.assignedOfficer.sector || 'No Sector'})
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-4">
              {complaint.description}
            </p>

            {/* Images Grid */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Attached Complaint Images ({complaint.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.images.map((img, i) => (
                    <a 
                      key={i} 
                      href={img.startsWith('/uploads') ? `http://localhost:5000${img}` : img} 
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-video rounded-xl overflow-hidden shadow border border-slate-100 dark:border-slate-850 hover:opacity-90 transition-opacity"
                    >
                      <img src={img.startsWith('/uploads') ? `http://localhost:5000${img}` : img} alt={`complaint attachment ${i}`} className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Address bar */}
            <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-darkbg-700/50 rounded-xl text-xs text-slate-550 border border-slate-100 dark:border-slate-800">
              <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{complaint.address}</span>
            </div>

            {/* Mini location map */}
            {complaint.location?.coordinates && (
              <div className="h-56 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-850">
                <ComplaintMap 
                  mode="view" 
                  complaints={[complaint]} 
                  center={[complaint.location.coordinates[1], complaint.location.coordinates[0]]} 
                  zoom={14} 
                />
              </div>
            )}
          </div>

          {/* Comments Feed */}
          <div className="card-premium p-6 space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
              Discussion & Updates
            </h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No discussions posted yet. Be the first to comment.</p>
              ) : (
                comments.map(comment => {
                  const isCommentOwner = comment.user?._id === user?.id;
                  return (
                    <div key={comment._id} className="flex gap-3 text-sm">
                      {comment.user?.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user?.name}
                          className="h-8 w-8 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-darkbg-700 shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-slate-100 dark:ring-darkbg-700 uppercase select-none shrink-0">
                          {comment.user?.name ? comment.user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
                        </div>
                      )}
                      <div className="flex-1 bg-slate-50 dark:bg-darkbg-700/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                            {comment.user?.name}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-darkbg-700 text-slate-500 uppercase font-bold tracking-wide">
                              {comment.user?.role}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                      
                      {(isCommentOwner || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="self-center p-1.5 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/10 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a message or ask an update..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg-700 border border-slate-200 dark:border-slate-800 focus-ring text-sm rounded-xl text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {submittingComment ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
              </button>
            </form>
          </div>

        </div>

        {/* Right 1 Column: Timelines & Status controllers */}
        <div className="space-y-8">
          
          {/* Vertical Timeline Progress */}
          <div className="card-premium p-6 space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Complaint History Timeline
            </h3>

            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6">
              {complaint.timeline && complaint.timeline.map((item, index) => (
                <div key={index} className="relative pl-6">
                  {/* Timeline node marker */}
                  <span className="absolute -left-3.5 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-darkbg-800 text-brand-600 dark:text-brand-500 border-2 border-brand-500 shadow-sm">
                    <CheckCircle2 className="h-4.5 w-4.5 text-brand-655 text-brand-500 fill-white dark:fill-darkbg-800" />
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        {item.status}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                      {item.notes}
                    </p>

                    {item.officer && (
                      <span className="block text-[9px] font-semibold text-slate-400">
                        Updated by: {item.officer.name} ({item.officer.role === 'Municipal Officer' ? (item.officer.sector || 'No Sector') : item.officer.role})
                      </span>
                    )}

                    {/* Timeline Attached images */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex gap-1.5 pt-1.5">
                        {item.images.map((tImg, idx) => (
                          <a 
                            key={idx} 
                            href={tImg.startsWith('/uploads') ? `http://localhost:5000${tImg}` : tImg} 
                            target="_blank" 
                            rel="noreferrer"
                            className="h-10 w-16 rounded overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0"
                          >
                            <img src={tImg.startsWith('/uploads') ? `http://localhost:5000${tImg}` : tImg} alt="timeline progress" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ADMIN Control panel */}
          {isAdmin && (
            <div className="card-premium p-6 space-y-6 border-t-4 border-t-success-500">
              <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-1">
                <UserCheck className="h-5 w-5 text-success-500" /> Admin Console
              </h3>
              
              {/* Verify & Reject controls */}
              {['Reported', 'Verified'].includes(complaint.status) && (
                <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  {complaint.status === 'Reported' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-550 dark:text-slate-400">Verify this complaint is real and located on municipal boundaries.</p>
                      <textarea
                        placeholder="Enter verification notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 dark:bg-darkbg-700 border border-slate-200 dark:border-slate-800 rounded-xl focus-ring text-slate-800 dark:text-white"
                        rows={2}
                      />
                      <button
                        onClick={handleAdminVerify}
                        disabled={adminLoading}
                        className="w-full py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        {adminLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Mark Complaint Verified
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                    <p className="text-xs text-slate-550 dark:text-slate-400">Reject this complaint if it is invalid, spam, or duplicate.</p>
                    <textarea
                      placeholder="Enter rejection reasons or notes..."
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-darkbg-700 border border-slate-200 dark:border-slate-800 rounded-xl focus-ring text-slate-800 dark:text-white"
                      rows={2}
                    />
                    <button
                      onClick={handleAdminReject}
                      disabled={adminLoading}
                      className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      {adminLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Reject Complaint
                    </button>
                  </div>
                </div>
              )}

              {/* Close resolved complaints */}
              {complaint.status === 'Resolved' && (
                <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <p className="text-xs text-slate-550 dark:text-slate-400">Close this complaint once you confirm the resolution is completed satisfactorily.</p>
                  <textarea
                    placeholder="Enter closure notes..."
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-darkbg-700 border border-slate-200 dark:border-slate-800 rounded-xl focus-ring text-slate-800 dark:text-white"
                    rows={2}
                  />
                  <button
                    onClick={handleAdminClose}
                    disabled={adminLoading}
                    className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white bg-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {adminLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Verify & Close Complaint
                  </button>
                </div>
              )}

              {/* Assign Officer selection form */}
              {['Reported', 'Verified', 'Assigned'].includes(complaint.status) && (
                <form onSubmit={handleAdminAssign} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Assign Municipal Officer
                    </label>
                    <select
                      value={selectedOfficer}
                      onChange={(e) => setSelectedOfficer(e.target.value)}
                      className="mt-1.5 w-full text-xs p-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-855 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus-ring font-semibold"
                    >
                      <option value="">Select Officer...</option>
                      {(() => {
                        const compSector = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'].find(zone => 
                          complaint?.address?.toLowerCase().includes(zone.toLowerCase())
                        ) || 'No Sector';

                        const sorted = [...officers].sort((a, b) => {
                          const aMatch = a.sector === compSector;
                          const bMatch = b.sector === compSector;
                          if (aMatch && !bMatch) return -1;
                          if (!aMatch && bMatch) return 1;
                          return 0;
                        });

                        return sorted.map(off => (
                          <option key={off._id} value={off._id}>
                            {off.name} ({off.sector || 'No Sector'})
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Assignment Directives
                    </label>
                    <textarea
                      placeholder="Add specific details or priority instructions..."
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      className="mt-1.5 w-full text-xs p-2 bg-slate-50 dark:bg-darkbg-700 border border-slate-200 dark:border-slate-800 rounded-xl focus-ring text-slate-800 dark:text-white"
                      rows={2}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {adminLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Assignment
                  </button>
                </form>
              )}
            </div>
          )}

          {/* OFFICER Control panel */}
          {isAssignedOfficer && (
            <div className="card-premium p-6 space-y-6 border-t-4 border-t-warning-500">
              <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-1">
                <CheckCircle2 className="h-5 w-5 text-warning-500" /> Officer Controls
              </h3>

              {['Assigned', 'Accepted', 'In Progress'].includes(complaint.status) ? (
                <form onSubmit={handleOfficerUpdate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Advance Timeline Status
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="mt-1.5 w-full text-xs p-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus-ring font-semibold"
                    >
                      {complaint.status === 'Assigned' && (
                        <>
                          <option value="Accepted">Accept Assignment</option>
                          <option value="Rejected">Reject Ticket</option>
                        </>
                      )}
                      {complaint.status === 'Accepted' && (
                        <option value="In Progress">Start Repair Work</option>
                      )}
                      {complaint.status === 'In Progress' && (
                        <option value="Resolved">Mark Resolved</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Progress Notes
                    </label>
                    <textarea
                      placeholder="Report crew actions, details of replaced parts, or reason for rejections..."
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      className="mt-1.5 w-full text-xs p-2 bg-slate-50 dark:bg-darkbg-700 border border-slate-200 dark:border-slate-800 rounded-xl focus-ring text-slate-800 dark:text-white"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Add work photos */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Attach Progress Photos
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {officerPreviews.map((preview, i) => (
                        <img key={i} src={preview} alt="preview" className="h-10 w-16 rounded object-cover border border-slate-200" />
                      ))}
                      <label className="h-10 w-16 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded cursor-pointer hover:border-brand-500 text-slate-400 hover:text-brand-500">
                        <ImageIcon className="h-4 w-4" />
                        <input type="file" multiple accept="image/*" onChange={handleOfficerFiles} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={officerLoading}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-655 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10"
                  >
                    {officerLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Submit Progress Log
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Ticket closed or resolved. No actions pending.</p>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Citizen Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Complaint Ticket?"
        message="Are you sure you want to remove this complaint? This will permanently delete the report, timeline, and associated comments. This action is irreversible."
        confirmText="Yes, Delete Ticket"
        onConfirm={handleCitizenDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

    </div>
  );
};

export default ComplaintDetails;
