import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Sun, Moon, LogOut, User, Menu, X, CheckSquare, Shield, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Toggle Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      }
      setShowNotifications(false);
      if (notif.relatedComplaint) {
        navigate(`/complaints/${notif.relatedComplaint._id || notif.relatedComplaint}`);
      }
    } catch (err) {
      console.error('Error clearing notification:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-darkbg-800/80 backdrop-blur-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left section: Branding & Menu Trigger */}
          <div className="flex items-center gap-3">
            {user && (
              <button 
                onClick={onMenuToggle} 
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-colors"
                aria-label="Toggle Navigation Sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg shadow-md shadow-brand-500/20">
                CF
              </span>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                Civic<span className="text-brand-500">Fix</span>
              </span>
            </Link>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-all duration-300"
              title="Toggle Theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user && (
              <>
                {/* Role badge */}
                <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 border border-brand-100 dark:border-brand-900/50">
                  {user.role === 'Administrator' && <Shield className="h-3 w-3" />}
                  {user.role === 'Municipal Officer' && <CheckSquare className="h-3 w-3" />}
                  {user.role === 'Citizen' && <User className="h-3 w-3" />}
                  {user.role}
                </div>

                {/* Notifications dropdown bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-all"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-darkbg-800">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkbg-800 p-2 shadow-xl ring-1 ring-black/5">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2 pb-3">
                        <span className="font-semibold text-slate-800 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllRead} 
                            className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto py-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-sm text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full text-left flex flex-col gap-1 p-3 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-darkbg-700 ${!notif.isRead ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-semibold ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {notif.message}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkbg-700 p-1.5 transition-all"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User avatar"
                        className="h-8 w-8 rounded-lg object-cover ring-2 ring-brand-500/10"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-brand-500/10 uppercase select-none">
                        {user.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
                      </div>
                    )}
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-darkbg-800 p-2 shadow-xl ring-1 ring-black/5">
                      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-darkbg-700"
                        >
                          <User className="h-4 w-4" />
                          View Profile
                        </Link>
                        
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/15"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!user && (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-all">
                  Log in
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10 transition-all">
                  Sign up
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
