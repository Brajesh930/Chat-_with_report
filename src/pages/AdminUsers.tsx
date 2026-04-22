import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { UserPlus, Search, Shield, User, Trash2, Edit2, Key, RefreshCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [clientId, setClientId] = useState('');
  const [questionLimit, setQuestionLimit] = useState(50);

  const fetchData = async () => {
    try {
      const usersData = await apiFetch('/admin/users');
      const clientsData = await apiFetch('/admin/clients');
      setUsers(usersData);
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

  const resetForm = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('employee');
    setClientId('');
    setQuestionLimit(50);
  };

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(''); // Don't show old password
    setRole(u.role);
    setClientId(u.client_id || '');
    setQuestionLimit(u.question_limit || 50);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiFetch(`/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ 
            password: password || undefined, 
            role, 
            client_id: clientId || null,
            question_limit: Number(questionLimit)
          }),
        });
      } else {
        await apiFetch('/admin/users', {
          method: 'POST',
          body: JSON.stringify({ 
            username, 
            password, 
            role, 
            client_id: clientId || null,
            question_limit: Number(questionLimit)
          }),
        });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/admin/users/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      setIsConfirmingDelete(false);
      fetchData();
    } catch (err) {
      alert(err);
      setDeleteId(null);
      setIsConfirmingDelete(false);
    }
  };

  const handleResetUsage = async (userId: number) => {
    try {
      await apiFetch(`/admin/users/${userId}/reset-usage`, { method: 'POST' });
      fetchData();
    } catch (err) {
      alert(err);
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
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Access Control Center</h1>
          </div>
          <p className="text-slate-500 font-medium">Provision and audit system credentials for stakeholders and personnel.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-bold shadow-xl shadow-brand-orange/10"
        >
          <UserPlus size={18} />
          Create Credential
        </button>
      </div>

      <div className="glass-panel overflow-hidden border-brand-soft-orange shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-soft-orange bg-brand-soft-orange/10">
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identity Handle</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Level</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Research Quota</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stakeholder Assignment</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-orange/60 bg-white/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-brand-soft-orange/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-soft-orange/20 text-slate-600 flex items-center justify-center border border-brand-soft-orange font-mono text-[10px] font-bold">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors">{u.username}</p>
                      <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase mt-0.5">UID: {u.id.toString().padStart(6, '0')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                    u.role === 'admin' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 
                    u.role === 'employee' ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  }`}>
                    {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2">
                       <span className={`text-[11px] font-bold ${u.questions_asked >= u.question_limit ? 'text-red-500' : 'text-slate-900'}`}>
                        {u.questions_asked}
                      </span>
                      <span className="text-slate-300 text-[10px]">/</span>
                      <span className="text-slate-500 text-[11px] font-medium">{u.question_limit}</span>
                      {u.questions_asked >= u.question_limit * 0.8 && (
                        <AlertTriangle size={12} className={u.questions_asked >= u.question_limit ? 'text-red-500' : 'text-amber-500'} />
                      )}
                    </div>
                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${u.questions_asked >= u.question_limit ? 'bg-red-500' : 'bg-brand-orange'}`}
                        style={{ width: `${Math.min(100, (u.questions_asked / u.question_limit) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  {u.client_id ? clients.find(c => c.id === u.client_id)?.name : <span className="text-slate-300">Internal</span>}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 text-right">
                    <button 
                      onClick={() => handleResetUsage(u.id)}
                      className="p-2 text-slate-500 hover:text-brand-orange transition-all hover:bg-brand-orange/10 rounded-lg group"
                      title="Reset Research Quota"
                    >
                      <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="p-2 text-slate-500 hover:text-brand-cyan transition-all hover:bg-brand-cyan/10 rounded-lg group"
                      title="Override Parameters"
                    >
                      <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => {
                        setDeleteId(u.id);
                        setIsConfirmingDelete(true);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 transition-all hover:bg-red-400/10 rounded-lg group"
                      title="Deauthorize Identity"
                    >
                      <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
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

            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
              {editingUser ? 'Parameter Override' : 'Credential Issuance'}
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-8">
              {editingUser ? `Auditing Identity: ${editingUser.username}` : 'Provisioning System Credential Matrix'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Identity Handle</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`input-field bg-white border-brand-soft-orange ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="un_designated_user"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  {editingUser ? 'Security Pulse (New Passkey)' : 'Security Pulse (Initial Passkey)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field bg-white border-brand-soft-orange text-slate-900"
                    placeholder={editingUser ? 'Leave null to maintain pulse...' : '••••••••'}
                  />
                  {editingUser && <Key size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Access Protocol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field appearance-none bg-white border-brand-soft-orange text-slate-600 focus:text-slate-900 font-bold"
                >
                  <option value="employee">Technical Personnel (Employee)</option>
                  <option value="client">Stakeholder Partner (Client)</option>
                  <option value="admin">Matrix Architect (Admin)</option>
                </select>
              </div>

              <AnimatePresence>
                {role === 'client' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Stakeholder Anchor</label>
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="input-field appearance-none bg-white border-brand-soft-orange text-slate-600 font-bold"
                    >
                      <option value="">Select Organizational Root</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id} className="bg-white">{c.name}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Research Analytical Quota</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={questionLimit}
                    onChange={(e) => setQuestionLimit(Number(e.target.value))}
                    className="input-field bg-white border-brand-soft-orange text-slate-900"
                    placeholder="50"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Search size={14} />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium px-1 uppercase tracking-tight italic">Max AI queries allocated to this identity matrix.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-white border border-brand-soft-orange rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-brand-soft-orange/10 hover:text-slate-900 transition-all font-display"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                  {editingUser ? 'OVERWRITE' : 'DEPLOY'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmingDelete}
        title="Revoke Credentials?"
        message="Are you sure you want to deauthorize this system identity? All access rights will be terminated immediately."
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setIsConfirmingDelete(false);
          setDeleteId(null);
        }}
        confirmLabel="Deauthorize"
      />
    </div>
  );
}
