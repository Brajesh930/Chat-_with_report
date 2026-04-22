import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { AlertCircle, CheckCircle, Clock, ShieldAlert, History, RefreshCw, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const data = await apiFetch('/admin/alerts');
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds for "live" feel
    const interval = setInterval(() => fetchAlerts(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = async (id: number) => {
    try {
      await apiFetch(`/admin/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      });
      fetchAlerts();
    } catch (err) {
      alert(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
    </div>
  );

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Infrastructure Surveillance</h1>
          </div>
          <p className="text-slate-500 font-medium">Monitor system outages, resource exhaustion signals, and technical health.</p>
        </div>

        <button 
          onClick={() => fetchAlerts()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-soft-orange rounded-xl text-[11px] font-bold text-slate-600 hover:text-brand-orange hover:border-brand-orange/30 shadow-sm transition-all group"
        >
          <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          Refresh Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Technical Signals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Active Critical Signals</h2>
          </div>
          
          {activeAlerts.length === 0 ? (
            <div className="glass-panel p-10 text-center border-brand-soft-orange bg-emerald-50/20 border-dashed">
              <CheckCircle size={32} className="mx-auto text-emerald-500 mb-4" />
              <p className="text-emerald-700 font-bold uppercase tracking-widest text-[10px]">All Systems Operational</p>
              <p className="text-slate-500 text-xs mt-1">No active infrastructure resource exhaustion detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={alert.id} 
                  className="glass-panel overflow-hidden"
                >
                  <div className={`flex items-start gap-4 p-6 border-l-4 relative group overflow-hidden ${
                    alert.type === 'RESOURCE_EXHAUSTED' 
                      ? 'border-red-200 bg-red-50/30 border-l-red-500' 
                      : alert.type === 'QUOTA_WARNING' 
                        ? 'border-blue-200 bg-blue-50/30 border-l-blue-500'
                        : 'border-amber-200 bg-amber-50/30 border-l-amber-500'
                  }`}>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={() => handleResolveAlert(alert.id)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg shadow-lg transition-all uppercase tracking-widest ${
                          alert.type === 'RESOURCE_EXHAUSTED'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                            : 'bg-slate-700 text-white hover:bg-slate-900 shadow-slate-500/20'
                        }`}
                      >
                        {alert.type === 'RESOURCE_EXHAUSTED' ? 'Restore Infrastructure' : 'Acknowledge Signal'}
                      </button>
                    </div>
                    
                    <div className={`mt-1 p-2 rounded-lg ${
                      alert.type === 'RESOURCE_EXHAUSTED' ? 'bg-red-100 text-red-600' : 
                      alert.type === 'QUOTA_WARNING' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {alert.type === 'QUOTA_WARNING' ? <Info size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                          alert.type === 'RESOURCE_EXHAUSTED' ? 'bg-red-100 text-red-600' : 
                          alert.type === 'QUOTA_WARNING' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>{alert.type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-tight pr-32">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-2 font-medium italic">
                        {alert.type === 'RESOURCE_EXHAUSTED' 
                          ? 'Operational Gate: Total AI discovery engine restricted.' 
                          : alert.type === 'QUOTA_WARNING'
                            ? 'Proactive Note: Approaching capacity threshold.'
                            : 'Operational Note: Individual researcher threshold reached.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Event Log */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <History size={20} className="text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Resolved Event Log</h2>
          </div>

          <div className="glass-panel border-brand-soft-orange overflow-hidden h-[500px] overflow-y-auto">
            {resolvedAlerts.length === 0 ? (
              <div className="py-20 text-center opacity-50">
                <Clock size={32} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No previous events</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-soft-orange/60">
                {resolvedAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tight">{alert.type}</span>
                      <span className="text-[9px] text-slate-300 font-mono italic">{new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
