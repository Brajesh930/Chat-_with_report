import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ReportUpload() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [version, setVersion] = useState('1.0');
  const [visibility, setVisibility] = useState('private');
  
  // Additional Project Details
  const [logicaptProjectCode, setLogicaptProjectCode] = useState('');
  const [clientProjectCode, setClientProjectCode] = useState('');
  const [patentNo, setPatentNo] = useState('');
  const [patentTitle, setPatentTitle] = useState('');
  const [projectType, setProjectType] = useState('');

  const [mainFiles, setMainFiles] = useState<File[]>([]);
  const [roughNotes, setRoughNotes] = useState<File[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await apiFetch('/admin/clients');
        setClients(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mainFiles.length === 0 && roughNotes.length === 0) {
      setError('Please upload at least one file.');
      return;
    }
    if (!clientId) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('client_id', clientId);
    formData.append('version', version);
    formData.append('visibility', visibility);
    
    // Additional Project Details
    formData.append('logicapt_project_code', logicaptProjectCode);
    formData.append('client_project_code', clientProjectCode);
    formData.append('patent_no', patentNo);
    formData.append('patent_title', patentTitle);
    formData.append('project_type', projectType);
    
    mainFiles.forEach(file => formData.append('mainFiles', file));
    roughNotes.forEach(file => formData.append('roughNotes', file));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      navigate(`/reports/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number, type: 'main' | 'rough') => {
    if (type === 'main') {
      setMainFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setRoughNotes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const FileList = ({ files, type }: { files: File[], type: 'main' | 'rough' }) => (
    <div className="mt-4 space-y-2">
      {files.map((f, i) => (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          key={i} 
          className="flex items-center justify-between bg-brand-soft-orange/10 px-3 py-2.5 rounded-xl border border-brand-soft-orange group shadow-sm"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="p-1.5 bg-white rounded-lg text-brand-orange border border-brand-soft-orange/50">
              <FileText size={14} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 truncate uppercase tracking-tight">{f.name}</span>
          </div>
          <button 
            type="button" 
            onClick={() => removeFile(i, type)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-6 bg-brand-orange rounded-full"></div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Technical Intake</h1>
        </div>
        <p className="text-slate-500 font-medium">Provision new analytical workstreams by uploading report disclosures and rough technical notes.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 glass-panel p-10 border-brand-soft-orange">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Project Identifier</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Patent Infringement Analysis - Project Zenith"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Stakeholder / Client</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input-field appearance-none bg-white font-bold"
              >
                <option value="" className="bg-white">Select Enterprise Entity</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="bg-white">{client.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Revision</label>
                <input
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="input-field"
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Data Classification</label>
                <select
                  value={visibility}
                  disabled={user?.role !== 'admin'}
                  onChange={(e) => setVisibility(e.target.value)}
                  className={`input-field appearance-none bg-white font-bold ${
                    user?.role !== 'admin' ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <option value="private" className="bg-white text-slate-900">Privileged (Internal)</option>
                  <option value="public" className="bg-white text-brand-orange">Client-Facing (Released)</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-brand-soft-orange/10 rounded-lg border border-brand-soft-orange">
                <AlertCircle size={14} className="text-slate-500" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">Only system administrators may authorize public release.</p>
              </div>

            <div className="pt-6 mt-6 border-t border-brand-soft-orange/30">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Additional Project Details (Optional)</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">LogicApt Code</label>
                    <input
                      type="text"
                      value={logicaptProjectCode}
                      onChange={(e) => setLogicaptProjectCode(e.target.value)}
                      className="input-field"
                      placeholder="LA-2024-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Client Code</label>
                    <input
                      type="text"
                      value={clientProjectCode}
                      onChange={(e) => setClientProjectCode(e.target.value)}
                      className="input-field"
                      placeholder="CLI-PROJ-X"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Patent Number</label>
                    <input
                      type="text"
                      value={patentNo}
                      onChange={(e) => setPatentNo(e.target.value)}
                      className="input-field"
                      placeholder="US 10,123,456 B2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Project Type</label>
                    <input
                      type="text"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="input-field"
                      placeholder="Infringement / FTO"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Patent Title</label>
                  <input
                    type="text"
                    value={patentTitle}
                    onChange={(e) => setPatentTitle(e.target.value)}
                    className="input-field"
                    placeholder="System and method for distributed ledger consensus..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex justify-between items-center">
                Deliverable Documents
                <span className="text-brand-orange text-[9px] lowercase italic">Client Accessible</span>
              </label>
              <div className="group relative">
                <div className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-brand-soft-orange rounded-2xl group-hover:border-brand-orange/40 group-hover:bg-brand-orange/5 transition-all cursor-pointer bg-white">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-brand-orange transition-colors mb-3" />
                  <p className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider">Archive Selection</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tight">PDF, DOCX, TXT</p>
                  <input 
                    type="file" 
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setMainFiles(prev => [...prev, ...files]);
                    }}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </div>
              </div>
              <FileList files={mainFiles} type="main" />
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex justify-between items-center">
                Disclosures & Research
                <span className="text-slate-500 text-[9px] lowercase italic">Internal Intelligence only</span>
              </label>
              <div className="group relative">
                <div className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-brand-soft-orange rounded-2xl group-hover:border-brand-orange/40 group-hover:bg-brand-orange/5 transition-all cursor-pointer bg-white">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-brand-orange transition-colors mb-3" />
                  <p className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider">Research Notes</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tight">PDF, DOCX, TXT</p>
                  <input 
                    type="file" 
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setRoughNotes(prev => [...prev, ...files]);
                    }}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </div>
              </div>
              <FileList files={roughNotes} type="rough" />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-brand-soft-orange mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || (mainFiles.length === 0 && roughNotes.length === 0) || !clientId}
            className="w-full sm:w-auto btn-primary px-10 py-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] font-bold shadow-xl shadow-brand-orange/20"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Technical Content
              </>
            ) : (
              <>
                <FileText size={18} />
                Execute Multi-Model Analysis
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
