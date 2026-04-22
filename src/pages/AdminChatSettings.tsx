import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { 
  MessageSquare, 
  Save, 
  Plus, 
  Trash2, 
  Bot, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminChatSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [reportQuestions, setReportQuestions] = useState<string[]>([]);
  const [discoveryQuestions, setDiscoveryQuestions] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch('/settings');
      setSettings(data);
      setReportQuestions(data.suggested_questions_report || []);
      setDiscoveryQuestions(data.suggested_questions_discovery || []);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string[]) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      });
      setMessage({ type: 'success', text: 'Chat settings updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateQuestion = (type: 'report' | 'discovery', index: number, value: string) => {
    if (type === 'report') {
      const newQuestions = [...reportQuestions];
      newQuestions[index] = value;
      setReportQuestions(newQuestions);
    } else {
      const newQuestions = [...discoveryQuestions];
      newQuestions[index] = value;
      setDiscoveryQuestions(newQuestions);
    }
  };

  const addQuestion = (type: 'report' | 'discovery') => {
    if (type === 'report') {
      if (reportQuestions.length >= 5) return;
      setReportQuestions([...reportQuestions, '']);
    } else {
      if (discoveryQuestions.length >= 5) return;
      setDiscoveryQuestions([...discoveryQuestions, '']);
    }
  };

  const removeQuestion = (type: 'report' | 'discovery', index: number) => {
    if (type === 'report') {
      setReportQuestions(reportQuestions.filter((_, i) => i !== index));
    } else {
      setDiscoveryQuestions(discoveryQuestions.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light-orange">
        <Loader2 className="animate-spin text-brand-orange" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Intelligence Chat Configuration</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage suggested analytical prompts for Jurisdictional Disclosures and Discovery Intelligence.</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-red-50 border-red-100 text-red-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-bold tracking-tight">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Invalidation Report Chat */}
        <div className="premium-card p-8 flex flex-col h-full bg-white shadow-lg border-brand-soft-orange">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shadow-inner">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invalidation Report Chat</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Primary Analytical Context</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-brand-soft-orange pb-2">Suggested Analytical Queries (Max 5)</p>
            {reportQuestions.map((q, idx) => (
              <div key={idx} className="flex gap-2 group">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateQuestion('report', idx, e.target.value)}
                  placeholder="Enter analytical prompt..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 outline-none transition-all font-medium"
                />
                <button 
                  onClick={() => removeQuestion('report', idx)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {reportQuestions.length < 5 && (
              <button 
                onClick={() => addQuestion('report')}
                className="w-full py-3 flex items-center justify-center gap-2 text-brand-orange hover:bg-brand-orange/5 border border-dashed border-brand-orange/30 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                <Plus size={14} /> Add Prompt
              </button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-brand-soft-orange">
            <button 
              onClick={() => handleSave('suggested_questions_report', reportQuestions)}
              disabled={saving}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-[10px] shadow-xl group"
            >
              <Save size={16} className="group-hover:scale-110 transition-transform" />
              {saving ? 'Synchronizing Backend...' : 'Commit Report Prompts'}
            </button>
          </div>
        </div>

        {/* Rough Discovery Document Chat */}
        <div className="premium-card p-8 flex flex-col h-full bg-white shadow-lg border-brand-soft-orange">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shadow-inner">
              <Search size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Rough Discovery Chat</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Exploratory Context</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-brand-soft-orange pb-2">Discovery Roadmap Prompts (Max 5)</p>
            {discoveryQuestions.map((q, idx) => (
              <div key={idx} className="flex gap-2 group">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateQuestion('discovery', idx, e.target.value)}
                  placeholder="Enter discovery prompt..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan/50 outline-none transition-all font-medium"
                />
                <button 
                  onClick={() => removeQuestion('discovery', idx)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {discoveryQuestions.length < 5 && (
              <button 
                onClick={() => addQuestion('discovery')}
                className="w-full py-3 flex items-center justify-center gap-2 text-brand-cyan hover:bg-brand-cyan/5 border border-dashed border-brand-cyan/30 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                <Plus size={14} /> Add Prompt
              </button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-brand-soft-orange text-center">
            <button 
              onClick={() => handleSave('suggested_questions_discovery', discoveryQuestions)}
              disabled={saving}
              className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-brand-cyan/20 group transition-all"
            >
              <Save size={16} className="group-hover:scale-110 transition-transform" />
              {saving ? 'Synchronizing Backend...' : 'Commit Discovery Prompts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
