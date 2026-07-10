import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map, 
  User, 
  Settings, 
  Users, 
  BarChart3, 
  FolderLock, 
  HelpCircle,
  ClipboardList
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const linkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive 
        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-darkbg-700 hover:text-slate-900 dark:hover:text-white'
    }`;

  // Role based Nav Links
  const citizenLinks = [
    { name: 'Dashboard', path: '/citizen/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Report Complaint', path: '/report', icon: <PlusCircle className="h-5 w-5" /> },
    { name: 'Complaint Feed', path: '/feed', icon: <Map className="h-5 w-5" /> },
    { name: 'My Profile', path: '/profile', icon: <User className="h-5 w-5" /> }
  ];

  const officerLinks = [
    { name: 'My Assignments', path: '/officer/dashboard', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Global Feed', path: '/feed', icon: <Map className="h-5 w-5" /> },
    { name: 'My Profile', path: '/profile', icon: <User className="h-5 w-5" /> }
  ];

  const adminLinks = [
    { name: 'Analytics Dashboard', path: '/admin/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Verify & Manage', path: '/feed', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Manage Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'Categories Manager', path: '/admin/categories', icon: <FolderLock className="h-5 w-5" /> },
    { name: 'My Profile', path: '/profile', icon: <User className="h-5 w-5" /> }
  ];

  const getLinks = () => {
    switch (user.role) {
      case 'Administrator': return adminLinks;
      case 'Municipal Officer': return officerLinks;
      default: return citizenLinks;
    }
  };

  const navLinks = getLinks();

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside className={`fixed top-0 bottom-0 left-0 z-35 flex w-64 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-darkbg-800 pt-16 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:z-0`}>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-1">
            <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation Menu
            </span>
            <div className="mt-2 space-y-1">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.name} 
                  to={link.path}
                  onClick={onClose}
                  className={linkClass}
                >
                  {link.icon}
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 dark:bg-darkbg-700/40 border border-slate-100/50 dark:border-slate-800">
            <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
            <div className="text-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-350">System Online</p>
              <p className="text-[10px] text-slate-400">Ver 1.0.0 (Stable)</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
