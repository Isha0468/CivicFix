import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Users, Wrench, ArrowRight, Activity, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg-900 flex flex-col justify-between">
      
      {/* Top landing header */}
      <header className="px-4 lg:px-8 h-16 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-darkbg-800/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg shadow-md shadow-brand-500/20">
            CF
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">
            Civic<span className="text-brand-500">Fix</span>
          </span>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link 
              to="/dashboard-redirect" 
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10 transition-all flex items-center gap-1.5"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-darkbg-700 transition-all">
                Log in
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10 transition-all">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col items-center text-center overflow-hidden">
          {/* Visual gradient backdrop */}
          <div className="absolute top-0 -z-10 h-72 w-full max-w-7xl rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-600/5" />
          
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/25 text-brand-600 dark:text-brand-450 border border-brand-100/50 dark:border-brand-900/50">
              <Activity className="h-3.5 w-3.5" /> Empowering Municipal Communities
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Report Civic Issues. <br />
              <span className="text-brand-500">Track Progress.</span> Improve Cities.
            </h1>
            
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              CivicFix bridges the gap between residents and city officials. Report potholes, broken lights, and water leaks directly to the right municipal office and monitor resolution timelines in real time.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to={user ? "/dashboard-redirect" : "/register"}
                className="px-6 py-3.5 rounded-xl font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Reporting <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/feed"
                className="px-6 py-3.5 rounded-xl font-semibold bg-white dark:bg-darkbg-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-darkbg-700 transition-all flex items-center justify-center gap-2"
              >
                View Public Map Feed
              </Link>
            </div>
          </div>
        </section>

        {/* Feature listings */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-darkbg-850/50 border-y border-slate-250/30 dark:border-slate-800/80">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/10 text-brand-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">1. Report Instantly</h3>
              <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                Take photos, pin the exact GPS coordinates on our map, and describe the issue. Our AI assists by auto-categorizing and suggesting tags.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-accent-55 bg-pink-50 dark:bg-pink-900/10 text-pink-500">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">2. Community Power</h3>
              <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                Citizens can upvote other reports in their area. High upvote counts raise the priority of complaints on the city official's console.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">3. Track Execution</h3>
              <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                Get notified when an officer is assigned, begins execution, and uploads completion photos. Keep track of visual timestamps step-by-step.
              </p>
            </div>
          </div>
        </section>

        {/* Static Metrics panel */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-850 dark:text-white">
              Municipal Metrics That Matter
            </h2>
            <p className="text-sm text-slate-450 dark:text-slate-400">See how CivicFix makes a difference in cities worldwide.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="card-premium p-6 space-y-1">
              <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-500">92%</span>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400">Resolution Rate</p>
            </div>
            <div className="card-premium p-6 space-y-1">
              <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-500">&lt; 48h</span>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400">Average Resolve Time</p>
            </div>
            <div className="card-premium p-6 space-y-1">
              <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-500">25,000+</span>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400">Complaints Resolved</p>
            </div>
            <div className="card-premium p-6 space-y-1">
              <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-500">100+</span>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400">Active Municipalities</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800 bg-white dark:bg-darkbg-850 py-6 px-4 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} CivicFix – Report. Track. Improve. Built for Smart Cities.</p>
      </footer>

    </div>
  );
};

export default Home;
