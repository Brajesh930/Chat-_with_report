import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Users, Plus, User, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const [name, setName] = useState('');

  const fetchData = async () => {
    try {
      const clientsData = await apiFetch('/admin/clients');
      setClients(clientsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/clients', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setShowModal(false);
      setName('');
      fetchData();
    } catch (err) {
      alert(err);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/admin/clients/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      setIsConfirmingDelete(false);
      fetchData();
    } catch (err) {
      alert(err);
      setDeleteId(null);
      setIsConfirmingDelete(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-brand-orange rounded-full"></div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Organization Director</h1>
          </div>
          <p className="text-slate-500 font-medium">Manage jurisdictional and corporate stakeholder entities.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-bold shadow-xl shadow-brand-orange/10"
        >
          <Plus size={18} />
          Register Entity
        </button>
      </div>

      <div className="glass-panel overflow-hidden border-brand-soft-orange shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-soft-orange bg-brand-soft-orange/10">
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stakeholder Identity</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registration Date</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Administrative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-orange/60 bg-white/50">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-brand-soft-orange/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/20">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors">{c.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase mt-0.5">ORG-ID: {c.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-[11px] text-slate-500 font-medium tracking-tight">
                  {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        setDeleteId(c.id);
                        setIsConfirmingDelete(true);
                      }}
                      className="p-2 text-slate-600 hover:text-red-400 transition-all hover:bg-red-400/10 rounded-lg group"
                      title="Liquidate Entity"
                    >
                      <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-brand-soft-orange/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel max-w-md w-full p-10 border-brand-soft-orange shadow-2xl bg-white relative"
          >
            <div className="absolute top-0 right-0 p-4">
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-brand-orange transition-colors">
                  <Trash2 size={18} className="rotate-45" />
               </button>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Entity Registration</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-8">Provisioning New Stakeholder Core</p>
            
            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Corporate Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field bg-white border-brand-soft-orange"
                  placeholder="Legal Entity Identity"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-white border border-brand-soft-orange rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-brand-soft-orange/10 hover:text-slate-900 transition-all font-display"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                  Commit Entry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmingDelete}
        title="Liquidate Entity?"
        message="Are you sure you want to delete this stakeholder? All users assigned to this client will be unassigned. Associated reports must be purged first."
        onConfirm={handleDeleteClient}
        onCancel={() => {
          setIsConfirmingDelete(false);
          setDeleteId(null);
        }}
        confirmLabel="Deauthorize"
      />
    </div>
  );
}
