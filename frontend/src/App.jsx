import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Component imports
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SkeletonLoader from './components/SkeletonLoader';

// Page imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportComplaint from './pages/citizen/ReportComplaint';
import ComplaintFeed from './pages/citizen/ComplaintFeed';
import ComplaintDetails from './pages/citizen/ComplaintDetails';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCategories from './pages/admin/ManageCategories';

// Protected Route Guard (Authentication check)
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-900">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard-redirect" replace />;
  }

  return <Outlet />;
};

// Route Redirector based on user role
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Administrator': return <Navigate to="/admin/dashboard" replace />;
    case 'Municipal Officer': return <Navigate to="/officer/dashboard" replace />;
    default: return <Navigate to="/citizen/dashboard" replace />;
  }
};

// Main Layout wrapping sidebar and navbar
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-darkbg-900">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Guest authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated routes */}
          <Route element={<ProtectedRoute />}>
            
            <Route path="/dashboard-redirect" element={<DashboardRedirect />} />
            
            {/* Dashboard shared wrappers */}
            <Route element={<DashboardLayout />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/feed" element={<ComplaintFeed />} />
              <Route path="/complaints/:id" element={<ComplaintDetails />} />

              {/* Citizen Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Citizen']} />}>
                <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                <Route path="/report" element={<ReportComplaint />} />
              </Route>

              {/* Officer Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Municipal Officer']} />}>
                <Route path="/officer/dashboard" element={<OfficerDashboard />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/categories" element={<ManageCategories />} />
              </Route>
            </Route>

          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
