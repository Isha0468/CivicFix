import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldAlert, ArrowLeft, Key, Clipboard, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.data.success) {
        setResetToken(response.data.resetToken);
        toast.success('Reset link generated!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to request reset.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(resetToken);
    setCopied(true);
    toast.success('Token copied!');
    setTimeout(() => setCopied(false), 2000);
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
          Forgot Password
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Enter your email to retrieve your access recovery token.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkbg-800 py-8 px-4 border border-slate-100 dark:border-slate-800 shadow-premium sm:rounded-2xl sm:px-10">
          
          {!resetToken ? (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                    })}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm bg-slate-50 dark:bg-darkbg-700 text-slate-800 dark:text-white dark:border-slate-800 border-slate-200 focus-ring ${errors.email ? 'border-danger-500' : ''}`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Generating Token...' : 'Generate Reset Token'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100/30 text-slate-700 dark:text-slate-300">
                <span className="block text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-500 mb-2">
                  Simulation Recovery Token:
                </span>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  In a real production ecosystem, an email contains this token. Since we are testing locally, copy this code and paste it on the password update screen.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={resetToken} 
                    className="flex-1 bg-slate-100 dark:bg-darkbg-750 p-2.5 rounded-lg text-[10px] font-mono border border-slate-200 dark:border-slate-700 focus:outline-none truncate"
                  />
                  <button 
                    onClick={copyTokenToClipboard}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkbg-800 hover:bg-slate-50 dark:hover:bg-darkbg-700 text-slate-500"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4.5 w-4.5 text-success-500" /> : <Clipboard className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <Link
                to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                className="w-full py-3.5 px-4 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white flex justify-center items-center gap-2 shadow-md shadow-brand-500/15"
              >
                <Key className="h-4.5 w-4.5" /> Proceed to Reset Password
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
