import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { 
  Settings, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Globe,
  Link as LinkIcon,
  Mail,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminSystemSettings() {
  const { config, refreshConfig } = useAuth();
  const [localContacts, setLocalContacts] = useState(config.INSTITUTIONAL_CONTACTS);
  const [localLinks, setLocalLinks] = useState(config.ENTERPRISE_LINKS);
  const [localBrand, setLocalBrand] = useState(config.BRAND_CONFIG);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (key: string, value: any) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      });
      await refreshConfig();
      setMessage({ type: 'success', text: `${key.replace('_', ' ')} updated successfully.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const renderInput = (label: string, value: string, onChange: (val: string) => void) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 outline-none transition-all font-medium"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">System Branding & Configuration</h1>
          <p className="text-slate-500 mt-2 font-medium">Customize institutional contact points, enterprise references, and portal branding.</p>
        </div>
        <div className="hidden md:block">
           <div className="px-4 py-2 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[10px] text-brand-orange font-bold uppercase tracking-widest text-nowrap">Centralized Config Active</span>
           </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Brand Config */}
        <div className="premium-card p-8 flex flex-col h-full bg-white shadow-lg border-brand-soft-orange">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shadow-inner">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Brand Identity</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Visual Persona</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {renderInput('App Name', localBrand.NAME, (v) => setLocalBrand({...localBrand, NAME: v}))}
            {renderInput('Full Organization Name', localBrand.FULL_NAME, (v) => setLocalBrand({...localBrand, FULL_NAME: v}))}
            {renderInput('Marketing Tagline', localBrand.TAGLINE, (v) => setLocalBrand({...localBrand, TAGLINE: v}))}
            {renderInput('Logo URL', localBrand.LOGO_URL, (v) => setLocalBrand({...localBrand, LOGO_URL: v}))}
            
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Logo Preview</p>
               <div className="h-16 flex items-center justify-center">
                  <img src={localBrand.LOGO_URL} alt="Preview" className="max-h-full w-auto" />
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-brand-soft-orange">
            <button 
              onClick={() => handleSave('BRAND_CONFIG', localBrand)}
              disabled={saving}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-[10px] shadow-xl group"
            >
              <Save size={16} className="group-hover:scale-110 transition-transform" />
              {saving ? 'Processing...' : 'Apply Branding Changes'}
            </button>
          </div>
        </div>

        {/* Institutional Contacts */}
        <div className="premium-card p-8 flex flex-col h-full bg-white shadow-lg border-brand-soft-orange">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Contact Points</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Communication Channels</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {renderInput('Primary Email', localContacts.PRIMARY_EMAIL, (v) => setLocalContacts({...localContacts, PRIMARY_EMAIL: v}))}
            {renderInput('Technical Support Email', localContacts.TECHNICAL_SUPPORT, (v) => setLocalContacts({...localContacts, TECHNICAL_SUPPORT: v}))}
          </div>

          <div className="mt-8 pt-6 border-t border-brand-soft-orange">
            <button 
              onClick={() => handleSave('INSTITUTIONAL_CONTACTS', localContacts)}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-200 group transition-all"
            >
              <Save size={16} className="group-hover:scale-110 transition-transform" />
              {saving ? 'Processing...' : 'Update Contact Info'}
            </button>
          </div>
        </div>

        {/* Enterprise Links */}
        <div className="premium-card p-8 flex flex-col h-full bg-white shadow-lg border-brand-soft-orange">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">External References</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Corporate Web Ecosystem</p>
            </div>
          </div>

          <div className="space-y-4 flex-1 max-h-[500px] overflow-y-auto px-1 scrollbar-hide">
            {renderInput('Corporate Website', localLinks.WEBSITE, (v) => setLocalLinks({...localLinks, WEBSITE: v}))}
            {renderInput('LinkedIn Profile', localLinks.LINKEDIN, (v) => setLocalLinks({...localLinks, LINKEDIN: v}))}
            {renderInput('Services Page', localLinks.SERVICES, (v) => setLocalLinks({...localLinks, SERVICES: v}))}
            {renderInput('Industry Insights / Blog', localLinks.INSIGHTS, (v) => setLocalLinks({...localLinks, INSIGHTS: v}))}
            {renderInput('Contact Page', localLinks.CONTACT, (v) => setLocalLinks({...localLinks, CONTACT: v}))}
            {renderInput('Privacy Policy', localLinks.PRIVACY, (v) => setLocalLinks({...localLinks, PRIVACY: v}))}
            {renderInput('Terms of Service', localLinks.TERMS, (v) => setLocalLinks({...localLinks, TERMS: v}))}
            {renderInput('Search Services', localLinks.SEARCH_SERVICES, (v) => setLocalLinks({...localLinks, SEARCH_SERVICES: v}))}
            {renderInput('About Us', localLinks.ABOUT, (v) => setLocalLinks({...localLinks, ABOUT: v}))}
          </div>

          <div className="mt-8 pt-6 border-t border-brand-soft-orange">
            <button 
              onClick={() => handleSave('ENTERPRISE_LINKS', localLinks)}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-200 group transition-all"
            >
              <Save size={16} className="group-hover:scale-110 transition-transform" />
              {saving ? 'Processing...' : 'Synchronize Links'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
