import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      token: '',
      password: '',
      confirmPassword: ''
    }
  });

  const passwordValue = watch('password');

  // Load token from url search parameters if present
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setValue('token', urlToken);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token: data.token,
        newPassword: data.password
      });

      if (response.data.success) {
        toast.success('Password updated successfully! Please log in.');
        navigate('/login');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Password reset failed. Invalid or expired token.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg">CF</span>
          <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">Civic<span className="text-brand-500">Fix</span></span>
        </div>
        <h2 className="mt-6 font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Reset Password
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Enter your recovery token and type your new password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkbg-800 py-8 px-4 border border-slate-100 dark:border-slate-800 shadow-premium sm:rounded-2xl sm:px-10">
          
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Token field */}
            <div>
              <label htmlFor="token" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reset Token Key
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <input
                  id="token"
                  type="text"
                  {...register('token', { required: 'Reset token is required' })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.token ? 'border-danger-500' : ''}`}
                  placeholder="Paste JWT recovery token here"
                />
              </div>
              {errors.token && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.token.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                New Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.password ? 'border-danger-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your new password',
                    validate: value => value === passwordValue || 'Passwords do not match'
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {submitting ? 'Updating Password...' : 'Reset Password'}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default React.memo(ResetPassword);
