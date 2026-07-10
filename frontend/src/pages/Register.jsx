import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { register: signup, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const passwordValue = watch('password');

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard-redirect');
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const res = await signup(data.name, data.email, data.password, data.phone);
    setSubmitting(false);
    if (res && res.success) {
      navigate('/citizen/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-md shadow-brand-500/20">
            CF
          </span>
          <span className="font-display font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white">
            Civic<span className="text-brand-500">Fix</span>
          </span>
        </Link>
        <h2 className="mt-6 text-center font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          Create account
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          Join CivicFix to report & track neighborhood improvements
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkbg-800 py-8 px-4 border border-slate-100 dark:border-slate-800/80 shadow-premium sm:rounded-2xl sm:px-10">
          
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Full name is required' })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.name ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email formatting'
                    }
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.email ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.password ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === passwordValue || 'Passwords do not match'
                  })}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.confirmPassword ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
              >
                {submitting ? 'Registering Account...' : 'Register'}
              </button>
            </div>

          </form>

          {/* Login redirection */}
          <div className="mt-6 flex justify-center text-xs">
            <span className="text-slate-450 dark:text-slate-400 mr-1">Already registered?</span>
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
