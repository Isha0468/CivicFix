import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ShieldAlert, CheckCircle, Sliders, ToggleLeft, ToggleRight, User, Eye, Loader2 } from 'lucide-react';
import api from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Confirmation state
  const [suspensionConfirmOpen, setSuspensionConfirmOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [userToRoleChange, setUserToRoleChange] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [targetSector, setTargetSector] = useState('No Sector');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const response = await api.get('/users', { params });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Toggle user suspension API
  const handleToggleSuspension = async () => {
    if (!userToSuspend) return;
    setSuspensionConfirmOpen(false);

    try {
      const response = await api.put(`/users/${userToSuspend._id}/suspend`);
      if (response.data.success) {
        const isSuspended = response.data.user.isSuspended;
        setUsers(prev => prev.map(u => u._id === userToSuspend._id ? { ...u, isSuspended } : u));
        toast.success(`User successfully ${isSuspended ? 'suspended' : 'activated'}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setUserToSuspend(null);
    }
  };

  // Promote / Demote user role API
  const handleRoleChange = async () => {
    if (!userToRoleChange || !targetRole) return;
    setRoleConfirmOpen(false);

    try {
      const selectedSec = targetRole === 'Municipal Officer' ? targetSector : 'No Sector';
      const response = await api.put(`/users/${userToRoleChange._id}/role`, { 
        role: targetRole,
        sector: selectedSec
      });
      if (response.data.success) {
        setUsers(prev => prev.map(u => u._id === userToRoleChange._id ? { ...u, role: targetRole, sector: selectedSec } : u));
        toast.success(`User role updated successfully!`);
      }
    } catch (err) {
      toast.error('Failed to update user role.');
    } finally {
      setUserToRoleChange(null);
      setTargetRole('');
      setTargetSector('No Sector');
    }
  };

  const triggerSuspensionPrompt = (user) => {
    setUserToSuspend(user);
    setSuspensionConfirmOpen(true);
  };

  const triggerRolePrompt = (user) => {
    setUserToRoleChange(user);
    setTargetRole(user.role === 'Municipal Officer' ? 'Municipal Officer' : 'Citizen');
    setTargetSector(user.sector || 'No Sector');
    setRoleConfirmOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Manage Users
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Promote roles, inspect account registration details, and suspend violations.
        </p>
      </div>

      {/* Table filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkbg-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-premium">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-xs"
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white text-xs transition-colors"
          >
            Search
          </button>
        </form>

        {/* Role Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
            <Sliders className="h-3.5 w-3.5" /> Filter Role:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus-ring rounded-xl text-xs font-semibold"
          >
            <option value="">All Users</option>
            <option value="Citizen">Citizens Only</option>
            <option value="Municipal Officer">Municipal Officers Only</option>
            <option value="Administrator">Administrators Only</option>
          </select>
        </div>

      </div>

      {/* Users table */}
      {loading ? (
        <div className="card-premium p-6">
          <SkeletonLoader type="table" />
        </div>
      ) : users.length === 0 ? (
        <div className="card-premium p-10 text-center text-xs text-slate-450 dark:text-slate-500">
          No users registered matching the selected criteria.
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80">
              <thead className="bg-slate-50 dark:bg-darkbg-700/50 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider text-left">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Sector</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-350 bg-white dark:bg-darkbg-800">
                {users.map(user => {
                  const isCurrentAdmin = user._id === currentUser.id;
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-darkbg-750/30 transition-colors">
                      
                      {/* Avatar and Name details */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt="avatar" 
                            className="h-9 w-9 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-darkbg-700" 
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-slate-100 dark:ring-darkbg-700 uppercase select-none">
                            {user.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-805 text-slate-805 text-slate-800 dark:text-white leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                        </div>
                      </td>

                      {/* Role indicator */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          user.role === 'Administrator' 
                            ? 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/10 dark:text-purple-500'
                            : user.role === 'Municipal Officer'
                              ? 'bg-brand-50 text-brand-600 border border-brand-100/30 dark:bg-brand-900/20 dark:text-brand-500'
                              : 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-darkbg-700 dark:text-slate-350'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Sector display */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {user.sector || 'No Sector'}
                        </span>
                      </td>

                      {/* Account status toggles */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.isSuspended
                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/15 dark:text-red-500'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/15 dark:text-emerald-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Actions (Change Role and Suspension controls) */}
                      <td className="px-6 py-4 flex items-center gap-4">
                        {user.role !== 'Administrator' ? (
                          <button
                            onClick={() => triggerRolePrompt(user)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-darkbg-700 font-bold text-xs text-brand-500 transition-colors"
                          >
                            Change Role
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Lock Protected</span>
                        )}

                        {!isCurrentAdmin ? (
                          <button
                            onClick={() => triggerSuspensionPrompt(user)}
                            className={`font-semibold text-xs transition-colors ${
                              user.isSuspended 
                                ? 'text-emerald-500 hover:text-emerald-600' 
                                : 'text-danger-500 hover:text-danger-600'
                            }`}
                          >
                            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        ) : (
                          user.role !== 'Administrator' && <span className="text-[10px] font-semibold text-slate-400">Lock Protected</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog: Suspension Prompt */}
      <ConfirmDialog
        isOpen={suspensionConfirmOpen}
        title={userToSuspend?.isSuspended ? "Reactivate User Account?" : "Suspend User Account?"}
        message={`Are you sure you want to ${userToSuspend?.isSuspended ? 'reactivate' : 'suspend'} the account belonging to: ${userToSuspend?.name} (${userToSuspend?.email})? ${userToSuspend?.isSuspended ? 'They will recover instant access to create and view complaints.' : 'This will block them from logging into the platform until unsuspended.'}`}
        confirmText={userToSuspend?.isSuspended ? "Activate Account" : "Suspend Account"}
        onConfirm={handleToggleSuspension}
        onCancel={() => setSuspensionConfirmOpen(false)}
        danger={!userToSuspend?.isSuspended}
      />

      {/* Modal: Change Role Modal */}
      {roleConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkbg-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-lg text-slate-805 dark:text-white">
              Change Role
            </h3>
            
            <p className="text-xs text-slate-550 dark:text-slate-450 leading-relaxed">
              Select a new role and sector for <strong>{userToRoleChange?.name}</strong>.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-darkbg-700/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="roleSelect"
                  value="Citizen"
                  checked={targetRole === 'Citizen'}
                  onChange={() => setTargetRole('Citizen')}
                  className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-350">Citizen</p>
                  <p className="text-[10px] text-slate-400">Can report and track neighborhood complaints.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-darkbg-700/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="roleSelect"
                  value="Municipal Officer"
                  checked={targetRole === 'Municipal Officer'}
                  onChange={() => setTargetRole('Municipal Officer')}
                  className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-350">Municipal Officer</p>
                  <p className="text-[10px] text-slate-400">Can accept, track, and resolve neighborhood complaints.</p>
                </div>
              </label>
            </div>

            {/* Sector Dropdown selector (only visible if Officer is selected) */}
            {targetRole === 'Municipal Officer' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Assign Sector
                </label>
                <select
                  value={targetSector}
                  onChange={(e) => setTargetSector(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus-ring font-semibold"
                >
                  <option value="No Sector">No Sector</option>
                  <option value="North Zone">North Zone</option>
                  <option value="South Zone">South Zone</option>
                  <option value="East Zone">East Zone</option>
                  <option value="West Zone">West Zone</option>
                  <option value="Central Zone">Central Zone</option>
                </select>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRoleConfirmOpen(false);
                  setUserToRoleChange(null);
                  setTargetRole('');
                  setTargetSector('No Sector');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-darkbg-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChange}
                className="flex-1 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white text-xs shadow-md transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsers;
