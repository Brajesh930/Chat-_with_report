import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  MoreVertical,
  Download,
  Trash2,
  AlertCircle,
  Info,
  X as CloseIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ReportList() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    if (deleteError) {
      const timer = setTimeout(() => setDeleteError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteError]);

  const fetchReports = async () => {
    try {
      const data = await apiFetch('/reports');
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/reports/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      setIsConfirmingDelete(false);
      fetchReports();
    } catch (err) {
      alert('Failed to delete report: ' + err);
      console.error(err);
      setDeleteId(null);
      setIsConfirmingDelete(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-brand-orange rounded-full"></div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Intelligence Archive</h1>
          </div>
          <p className="text-slate-600 font-medium">Repository of processed technical disclosures and analytical outputs.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {deleteError && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <AlertCircle size={14} />
              {deleteError}
            </motion.div>
          )}
          
          {(user?.role === 'admin' || user?.role === 'employee') && (
            <Link
              to="/reports/upload"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-bold shadow-xl shadow-brand-orange/10"
            >
              <Plus size={18} />
              Provision Intake
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search Intelligence Records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-brand-soft-orange rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-brand-soft-orange hover:text-brand-orange transition-all">
          <Filter size={18} />
          Query Filters
        </button>
      </div>

      <div className="glass-panel overflow-hidden border-slate-800/60 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-soft-orange bg-brand-soft-orange/30">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis Identity</th>
                {(user?.role === 'admin' || user?.role === 'employee') && (
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stakeholder</th>
                )}
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revision</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lifecycle</th>
                {(user?.role === 'admin' || user?.role === 'employee') && (
                  <th className="px-8 py-5 text-[10px) font-bold text-slate-500 uppercase tracking-widest">Classification</th>
                )}
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Indexed Date</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft-orange/60">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-brand-soft-orange/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl border border-brand-orange/20">
                        <FileText size={18} />
                      </div>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="text-left group/name"
                      >
                        <p className="text-sm font-bold text-slate-900 group-hover/name:text-brand-orange transition-colors flex items-center gap-2">
                          {report.title}
                          <Info size={12} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-brand-orange" />
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase mt-0.5">#{report.id.toString().padStart(6, '0')}</p>
                      </button>
                    </div>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'employee') && (
                    <td className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      {report.client_name || 'Restricted'}
                    </td>
                  )}
                  <td className="px-8 py-5 text-[11px] text-slate-500 font-bold uppercase">
                    v{report.version || '1.0'}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                      report.status === 'completed' || report.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      report.status === 'archived' ? 'bg-slate-800/50 text-slate-500 border-slate-700/50' :
                      report.status === 'revised' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {report.status === 'completed' || report.status === 'delivered' ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {report.status}
                    </span>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'employee') && (
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        report.visibility === 'public' ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {report.visibility === 'public' ? <Eye size={10} /> : <EyeOff size={10} />}
                        {report.visibility}
                      </span>
                    </td>
                  )}
                  <td className="px-8 py-5 text-[11px] text-slate-500 font-medium tracking-tight">
                    {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 translate-x-3">
                      <Link 
                        to={`/reports/${report.id}`} 
                        className="text-brand-orange hover:text-brand-orange/70 font-bold text-xs uppercase tracking-widest transition-colors py-1.5 px-3 rounded-lg hover:bg-brand-orange/10"
                      >
                        Details
                      </Link>
                      {report.file_url && (
                        <a 
                          href={report.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-500 hover:text-brand-orange transition-colors p-2"
                          title="Technical Download"
                        >
                          <Download size={18} />
                        </a>
                      )}
                      {(user?.role === 'admin' || user?.role === 'employee') && (
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (report.visibility === 'public') {
                                setDeleteError('Restrict classification to Privilege for deletion');
                              } else {
                                setDeleteId(report.id);
                                setIsConfirmingDelete(true);
                              }
                            }}
                            className={`p-2 transition-all group/del ${
                              report.visibility === 'public' 
                                ? 'text-slate-200 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-red-400 hover:bg-red-50 rounded-lg'
                            }`}
                            title={report.visibility === 'public' ? 'Switch to restricted for deletion' : 'Purge Record'}
                          >
                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'client' ? 5 : 7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-white border border-brand-soft-orange rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                        <FileText size={32} />
                      </div>
                      <p className="text-xl font-display font-bold text-slate-900 mb-1">Null Result Set</p>
                      <p className="text-slate-500 text-sm font-medium">No intelligence records match the specified query parameters.</p>
                      <button onClick={() => setSearch('')} className="mt-6 text-brand-orange hover:text-brand-orange/70 text-xs font-bold uppercase tracking-widest transition-colors">
                        Clear Identification Parameters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-brand-soft-orange/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-soft-orange"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center border border-brand-orange/20">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-slate-900">{selectedReport.title}</h2>
                      <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Intake ID: #{selectedReport.id.toString().padStart(6, '0')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-brand-soft-orange/5 p-4 rounded-2xl border border-brand-soft-orange/30">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">LogicApt Code</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{selectedReport.logicapt_project_code || 'N/A'}</p>
                  </div>
                  <div className="bg-brand-soft-orange/5 p-4 rounded-2xl border border-brand-soft-orange/30">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client Code</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{selectedReport.client_project_code || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-brand-soft-orange/20">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Type</span>
                    <span className="text-xs font-bold text-slate-900">{selectedReport.project_type || 'Unspecified'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-brand-soft-orange/20">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patent Number</span>
                    <span className="text-xs font-bold text-slate-900">{selectedReport.patent_no || 'N/A'}</span>
                  </div>
                  <div className="py-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Patent Title</span>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                      {selectedReport.patent_title || 'No title associated with this record.'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-soft-orange/20 flex gap-3">
                  <Link 
                    to={`/reports/${selectedReport.id}`}
                    onClick={() => setSelectedReport(null)}
                    className="flex-1 btn-primary py-3 rounded-xl text-center font-bold uppercase tracking-widest text-[10px]"
                  >
                    Enter Analysis Dashboard
                  </Link>
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isConfirmingDelete}
        title="Purge Analytical Record?"
        message="Are you sure you want to permanently delete this intelligence disclosure? This operation is irreversible."
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmingDelete(false);
          setDeleteId(null);
        }}
        confirmLabel="Purge"
      />
    </div>
  );
}
