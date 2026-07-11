import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Lock, Upload, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, updateAvatar } = useAuth();
  const getBackendBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  };
  const backendBaseUrl = getBackendBaseUrl();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      password: '',
      confirmPassword: ''
    }
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image is too large. Max size is 2MB.');
      return;
    }

    setAvatarLoading(true);
    const res = await updateAvatar(file);
    setAvatarLoading(false);
  };

  const onSubmit = async (data) => {
    // Validate match password if password field is filled
    if (data.password && data.password !== data.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setProfileLoading(true);
    const res = await updateProfile(data.name, data.phone, data.password);
    setProfileLoading(false);
    
    if (res && res.success) {
      // Clear password inputs
      reset({
        name: data.name,
        phone: data.phone,
        password: '',
        confirmPassword: ''
      });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details, avatar image, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left: Avatar Upload panel */}
        <div className="card-premium p-6 flex flex-col items-center justify-center text-center space-y-4 md:col-span-1">
          <div className="relative group">
            {user.avatar ? (
              <img
                src={user.avatar.startsWith('/uploads') ? `${backendBaseUrl}${user.avatar}` : user.avatar}
                alt="Avatar avatar"
                className="h-28 w-28 rounded-2xl object-cover ring-4 ring-brand-500/10 shadow-lg"
              />
            ) : (
              <div className="h-28 w-28 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-brand-500/10 uppercase select-none">
                {user.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
              </div>
            )}
            {avatarLoading && (
              <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center text-white">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            )}
          </div>
          
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-white">{user.name}</p>
            <div className="flex flex-col gap-1 items-center justify-center">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-darkbg-700 text-slate-500 uppercase">
                {user.role}
              </span>
              {user.role === 'Municipal Officer' && (
                <span className="text-[11px] font-semibold text-brand-500">
                  Sector: {user.sector || 'No Sector'}
                </span>
              )}
            </div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkbg-800 hover:bg-slate-50 dark:hover:bg-darkbg-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm transition-all">
            <Upload className="h-3.5 w-3.5" />
            Upload New Photo
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              className="hidden" 
              disabled={avatarLoading}
            />
          </label>
          <p className="text-[10px] text-slate-450 dark:text-slate-500">JPG, PNG or WEBP. Max 2MB.</p>
        </div>

        {/* Right: Personal info form */}
        <div className="card-premium p-6 md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="mt-1.5 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                  />
                </div>
                {errors.name && <span className="text-xs text-danger-500 mt-1">{errors.name.message}</span>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="mt-1.5 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                    placeholder="Enter phone digits"
                  />
                </div>
              </div>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address (Permanent)
              </label>
              <input
                type="email"
                readOnly
                value={user.email}
                className="mt-1.5 block w-full px-3 py-2.5 border rounded-xl text-sm bg-slate-100 dark:bg-darkbg-750/30 text-slate-400 dark:text-slate-500 dark:border-slate-800 border-slate-200 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Passwords */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Change Password (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="mt-1.5 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      {...register('password', {
                        minLength: { value: 6, message: 'Must be at least 6 characters' }
                      })}
                      className="block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <span className="text-xs text-danger-500 mt-1">{errors.password.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="mt-1.5 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      className="block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-3 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
