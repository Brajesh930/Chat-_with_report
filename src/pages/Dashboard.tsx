import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { 
  FileText, 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportsData = await apiFetch('/reports');
        setReports(reportsData);

        if (user?.role === 'admin' || user?.role === 'employee') {
          const clientsData = await apiFetch('/admin/clients');
          setClients(clientsData);
          if (user?.role === 'admin') {
            const usersData = await apiFetch('/admin/users');
            setUsers(usersData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      <header>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            Executive Summary
          </h1>
          <p className="text-slate-600 mt-2 font-medium">
            Welcome back, <span className="text-brand-orange">{user?.username}</span>. Monitor your IP analytics and patent reports.
          </p>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-6 group"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-2.5 bg-brand-orange/10 text-brand-orange rounded-xl border border-brand-orange/20 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Analytics</p>
          <p className="text-4xl font-display font-bold text-slate-900 mt-1">{reports.length}</p>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"></span>
            Reports processed
          </div>
        </motion.div>

        {user?.role === 'admin' && (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="premium-card p-6 group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise Clients</p>
              <p className="text-4xl font-display font-bold text-slate-900 mt-1">{clients.length}</p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                Registered profiles
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="premium-card p-6 group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-2.5 bg-brand-orange/10 text-brand-orange rounded-xl border border-brand-orange/20 group-hover:scale-110 transition-transform">
                  <UserPlus size={24} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Users</p>
              <p className="text-4xl font-display font-bold text-slate-900 mt-1">{users.length}</p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                Active collaborators
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Recent Reports */}
      <section>
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-orange rounded-full"></div>
            <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Recent Activity</h2>
          </div>
          <Link to="/reports" className="text-sm font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors flex items-center gap-2 group">
            Browse Archive <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-soft-orange bg-brand-soft-orange/30">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis Title</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Classification</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Updated</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-soft-orange/60">
                {reports.slice(0, 5).map((report) => (
                  <tr key={report.id} className="hover:bg-brand-soft-orange/20 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-orange transition-colors">{report.title}</p>
                      {report.client_name && (
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{report.client_name}</p>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        report.status === 'completed' || report.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        report.status === 'archived' ? 'bg-slate-800/50 text-slate-500 border-slate-700/50' :
                        report.status === 'revised' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {report.status === 'completed' || report.status === 'delivered' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        report.visibility === 'public' ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {report.visibility === 'public' ? <Eye size={10} /> : <EyeOff size={10} />}
                        {report.visibility}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[11px] text-slate-500 font-medium uppercase tracking-tight">
                      {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link 
                        to={`/reports/${report.id}`} 
                        className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange/70 font-bold text-xs uppercase tracking-widest transition-colors"
                      >
                        Details <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 text-sm italic">
                      No reports identified in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Quick Actions for Admin/Employee */}
      {(user?.role === 'admin' || user?.role === 'employee') && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="rounded-2xl p-8 text-white relative overflow-hidden group border border-brand-orange/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange to-brand-orange/80 opacity-95 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <FileText size={160} />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-display font-bold mb-2">Initiate Analysis</h3>
              <p className="text-orange-50 text-sm mb-6 leading-relaxed max-w-sm">Upload technical disclosures or patent filings to begin the automated analysis workflow.</p>
              <Link to="/reports/upload" className="inline-flex items-center gap-2 bg-white text-brand-orange px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-50 transition-all shadow-xl shadow-black/10">
                <Plus size={18} />
                New Analytics Upload
              </Link>
            </div>
          </motion.div>
          
          {user?.role === 'admin' && (
            <motion.div 
              whileHover={{ y: -5 }}
              className="premium-card p-8 group relative overflow-hidden"
            >
              <div className="absolute -right-8 -bottom-8 opacity-5 text-slate-400 group-hover:scale-110 transition-transform duration-500">
                <Users size={160} />
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Client Management</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed max-w-sm">Configure enterprise client accounts, manage access tiers, and audit platform usage.</p>
                <Link to="/admin/clients" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all border border-slate-800">
                  <Users size={18} />
                  Access Control
                </Link>
              </div>
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
}
