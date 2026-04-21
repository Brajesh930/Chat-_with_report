import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Settings, 
  Eye, 
  EyeOff,
  CheckCircle,
  Clock,
  StickyNote,
  MessageSquare,
  Download,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
  Info,
  X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import ConfirmationModal from '../components/ConfirmationModal';

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [chatContext, setChatContext] = useState<'report' | 'rough_notes'>('report');
  const [newNote, setNewNote] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const [isConfirmingClearChat, setIsConfirmingClearChat] = useState(false);
  const [isConfirmingDeleteFile, setIsConfirmingDeleteFile] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roughFileInputRef = useRef<HTMLInputElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    if (modError) {
      const timer = setTimeout(() => setModError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [modError]);

  const fetchChat = async () => {
    try {
      const history = await apiFetch(`/reports/${id}/chat?type=${chatContext}`);
      setChatHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportData = await apiFetch(`/reports`);
        const currentReport = reportData.find((r: any) => r.id === Number(id));
        setReport(currentReport);
        
        await fetchChat();

        if (user?.role !== 'client') {
          const [notesData, clientsData] = await Promise.all([
            apiFetch(`/reports/${id}/notes`),
            apiFetch(`/admin/clients`)
          ]);
          setNotes(notesData);
          setClients(clientsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const refreshReportData = async () => {
    try {
      const reportData = await apiFetch(`/reports`);
      const currentReport = reportData.find((r: any) => r.id === Number(id));
      setReport(currentReport);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChat();
  }, [chatContext]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatLoading) return;

    const userMessage = message;
    setMessage('');
    setChatLoading(true);

    // Add to local state and DB
    const newUserMsg = { role: 'user', message: userMessage, context_type: chatContext };
    setChatHistory(prev => [...prev, newUserMsg]);
    await apiFetch(`/reports/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify(newUserMsg),
    });

    try {
      // 1. Get files for the current context
      const relevantFiles = report.files?.filter((f: any) => 
        chatContext === 'report' ? !f.is_rough_note : f.is_rough_note
      ) || [];

      // 2. Fetch and convert files to base64 parts
      const fileParts = await Promise.all(relevantFiles.map(async (file: any) => {
        const supportedTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/heic',
          'image/heif'
        ];

        const isSupported = supportedTypes.includes(file.mime_type);

        // If it's not a supported binary type (like docx, text, or generic octet-stream), 
        // send as text part to avoid Gemini MIME errors
        if (!isSupported || file.mime_type?.startsWith('text/')) {
          return { text: `[CONTENT OF ${file.original_name}]:\n${file.content || '(Empty or failed extraction)'}` };
        }

        try {
          const res = await fetch(file.url);
          const blob = await res.blob();
          const base64Data = await fileToBase64(blob);
          return {
            inlineData: {
              data: base64Data,
              mimeType: file.mime_type || blob.type || 'application/pdf'
            }
          };
        } catch (err) {
          console.error(`Failed to load file ${file.original_name}:`, err);
          return null;
        }
      }));

      // Filter out failed loads
      const validFileParts = fileParts.filter(p => p !== null);

      // Gemini Call
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          // Provide files as context first
          { role: 'user', parts: [
            ...validFileParts,
            { text: `CONTEXT FILES: The files above are the ${chatContext === 'report' ? 'main report documents' : 'rough search notes'} for this analysis. Please use them to answer my questions.` }
          ]},
          // Include chat history
          ...chatHistory.map(c => ({ 
            role: c.role === 'user' ? 'user' : 'model', 
            parts: [{ text: c.message }] 
          })),
          // Latest message
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `You are an expert report analyst. You are chatting with a ${user?.role === 'client' ? 'Client' : 'Staff Member'} about a specific report titled "${report.title}". 
          
          CURRENT CONTEXT: ${chatContext === 'report' ? 'Main Report Files' : 'Rough Search Notes'}.
          
          Your knowledge is STRICTLY limited to the files provided in the conversation.
          If the user asks something not covered in these files, politely explain that you can only answer questions based on the provided documents.
          If there are multiple files, aggregate information from all of them to give a comprehensive answer.`,
        }
      });

      const botMessage = response.text || "I'm sorry, I couldn't process that.";
      const newBotMsg = { role: 'assistant', message: botMessage, context_type: chatContext };
      
      setChatHistory(prev => [...prev, newBotMsg]);
      await apiFetch(`/reports/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify(newBotMsg),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await apiFetch(`/reports/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: newNote }),
      });
      const updatedNotes = await apiFetch(`/reports/${id}/notes`);
      setNotes(updatedNotes);
      setNewNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMetadata = async (status: string, visibility: string, clientId?: number) => {
    if (user?.role === 'client') return;
    try {
      await apiFetch(`/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status, 
          visibility, 
          client_id: clientId !== undefined ? clientId : report.client_id 
        }),
      });
      await refreshReportData();
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  const statuses = ['uploaded', 'in review', 'completed', 'delivered', 'revised', 'archived'];

  const handleDeleteFile = async () => {
    if (!deletingFileId) return;
    if (report.visibility === 'public') {
      setModError('Switch it to private to edit any file');
      return;
    }
    try {
      await apiFetch(`/reports/${id}/files/${deletingFileId}`, { method: 'DELETE' });
      setDeletingFileId(null);
      setIsConfirmingDeleteFile(false);
      await refreshReportData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete file: ' + err);
      setDeletingFileId(null);
      setIsConfirmingDeleteFile(false);
    }
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>, isRough: boolean) => {
    if (report.visibility === 'public') {
      setModError('Switch it to private to edit any file');
      alert('Switch it to private to edit any file');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isRough', isRough.toString());

    try {
      await fetch(`${window.location.origin}/api/reports/${id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      await refreshReportData();
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setFileUploading(false);
      e.target.value = '';
    }
  };

  const handleClearHistory = async () => {
    try {
      await apiFetch(`/reports/${id}/chat?type=${chatContext}`, { method: 'DELETE' });
      setIsConfirmingClearChat(false);
      await fetchChat();
    } catch (err) {
      console.error(err);
      alert('Failed to clear chat history');
      setIsConfirmingClearChat(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
    </div>
  );
  if (!report) return (
    <div className="p-12 text-center glass-panel">
      <AlertCircle size={48} className="mx-auto text-slate-700 mb-4" />
      <h2 className="text-xl font-display font-bold text-white">Analysis Entry Not Found</h2>
      <p className="text-slate-500 mt-2">The requested technical disclosure record does not exist or has been relocated.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 glass-panel p-8 border-brand-soft-orange overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <FileText size={120} />
        </div>
        
        <div className="flex items-start gap-6 relative z-10">
          <div className="p-4 bg-brand-orange/10 text-brand-orange rounded-2xl border border-brand-orange/20 shadow-lg shadow-brand-orange/5">
            <FileText size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Project Reference</span>
              <span className="text-[10px] font-mono text-brand-orange uppercase">#{report.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-1">
              <button 
                onClick={() => setShowIdentity(true)}
                className="text-left group/name"
              >
                <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight group-hover/name:text-brand-orange transition-colors flex items-center gap-2">
                  {report.title}
                  <Info size={16} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-brand-orange" />
                </h1>
              </button>
              <div className="flex flex-wrap gap-2 pb-1">
                {report.logicapt_project_code && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                    LA: {report.logicapt_project_code}
                  </span>
                )}
                {report.client_project_code && (
                  <span className="px-2 py-0.5 rounded bg-brand-orange/5 text-[10px] font-bold text-brand-orange border border-brand-orange/10">
                    CLI: {report.client_project_code}
                  </span>
                )}
                {report.project_type && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
                    {report.project_type}
                  </span>
                )}
                {report.patent_no && (
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-[10px] font-bold text-purple-600 border border-purple-100">
                    PAT: {report.patent_no}
                  </span>
                )}
              </div>
            </div>
            {report.patent_title && (
              <p className="text-[11px] text-slate-400 font-medium italic mb-2">
                &quot;{report.patent_title}&quot;
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  Indexed {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Version:</span>
                <span className="text-[11px] text-brand-orange font-bold">{report.version || '1.0'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          {report.file_url && (
            <a 
              href={report.file_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold shadow-xl shadow-brand-orange/10"
            >
              <Download size={16} />
              Vault Access
            </a>
          )}
          
          {(user?.role === 'admin' || user?.role === 'employee') && (
            <div className="flex bg-brand-soft-orange/30 p-1 rounded-xl border border-brand-soft-orange shadow-inner">
              <button
                disabled={user?.role !== 'admin'}
                onClick={() => handleUpdateMetadata(report.status, 'private')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  report.visibility === 'private' 
                    ? 'bg-white text-slate-900 shadow-md border border-brand-soft-orange' 
                    : 'text-slate-500 hover:text-slate-700'
                } ${user?.role !== 'admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Privileged
              </button>
              <button
                disabled={user?.role !== 'admin'}
                onClick={() => handleUpdateMetadata(report.status, 'public')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  report.visibility === 'public' 
                    ? 'bg-brand-orange/20 text-brand-orange shadow-md border border-brand-orange/20' 
                    : 'text-slate-500 hover:text-slate-700'
                } ${user?.role !== 'admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Released
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Workspace Area (AI Chat & Notes) */}
        <div className="xl:col-span-8 space-y-8 h-full flex flex-col min-h-[700px]">
          <div className="glass-panel border-brand-soft-orange overflow-hidden flex flex-col flex-1 shadow-sm relative">
            {/* Tabs Header */}
            <div className="flex items-center justify-between px-8 bg-brand-soft-orange/10 border-b border-brand-soft-orange">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative ${
                    activeTab === 'chat' ? 'text-brand-orange' : 'text-slate-500 hover:text-brand-orange/60'
                  }`}
                >
                  <MessageSquare size={16} />
                  Intelligence Interface
                  {activeTab === 'chat' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange shadow-[0_0_10px_rgba(234,107,20,0.5)]" />
                  )}
                </button>
                {user?.role !== 'client' && (
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative ${
                      activeTab === 'notes' ? 'text-brand-orange' : 'text-slate-500 hover:text-brand-orange/60'
                    }`}
                  >
                    <StickyNote size={16} />
                    Consultant Notes
                    {activeTab === 'notes' && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange shadow-[0_0_10px_rgba(234,107,20,0.5)]" />
                    )}
                  </button>
                )}
              </div>

              {activeTab === 'chat' && (
                <div className="flex items-center gap-4 py-3">
                  {(user?.role === 'admin' || user?.role === 'employee') && chatHistory.length > 0 && (
                    <button
                      onClick={() => setIsConfirmingClearChat(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 group/clear"
                      title="Purge analytical history for this context"
                    >
                      <Trash2 size={14} className="group-hover/clear:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Clear History</span>
                    </button>
                  )}
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Knowledge Base:</span>
                  <div className="flex p-1 bg-white rounded-xl border border-brand-soft-orange">
                    <button
                      onClick={() => setChatContext('report')}
                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-tighter rounded-lg transition-all ${
                        chatContext === 'report' ? 'bg-brand-orange text-white' : 'text-slate-500 hover:text-brand-orange'
                      }`}
                    >
                      Primary
                    </button>
                    <button
                      onClick={() => setChatContext('rough_notes')}
                      className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-tighter rounded-lg transition-all ${
                        chatContext === 'rough_notes' ? 'bg-brand-orange text-white' : 'text-slate-500 hover:text-brand-orange'
                      }`}
                    >
                      Discovery
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-brand-soft-orange/5 scrollbar-thin scrollbar-thumb-brand-soft-orange">
              {activeTab === 'chat' ? (
                <>
                  <div className="flex flex-col gap-6">
                    {/* Welcome System Message */}
                    {chatHistory.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-panel p-6 border-brand-blue/10 bg-white flex items-start gap-4"
                      >
                        <div className="p-2 bg-brand-blue text-white rounded-lg shadow-lg">
                          <Bot size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-1">Analytical Core v3.0</p>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            System initialized. Interactive cross-examination is now available for the current document corpus. Specify technical queries or request risk assessment summaries.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <AnimatePresence initial={false}>
                      {chatHistory.map((chat, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] flex gap-4 ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                              chat.role === 'user' 
                                ? 'bg-white border-brand-soft-orange text-slate-500' 
                                : 'bg-brand-blue border-brand-blue/20 text-white'
                            }`}>
                              {chat.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                            </div>
                            <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                              chat.role === 'user' 
                                ? 'bg-white text-slate-900 border border-brand-soft-orange rounded-tr-none shadow-sm' 
                                : 'bg-brand-soft-orange text-slate-900 border border-brand-blue/10 rounded-tl-none prose prose-orange prose-sm max-w-none shadow-lg shadow-brand-blue/5'
                            }`}>
                              {chat.role === 'assistant' ? (
                                <ReactMarkdown>{chat.message}</ReactMarkdown>
                              ) : (
                                chat.message
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {chatLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-4">
                          <div className="w-9 h-9 rounded-xl bg-white border border-brand-blue/10 text-brand-blue flex items-center justify-center shadow-sm">
                            <Bot size={18} />
                          </div>
                          <div className="glass-panel border-brand-blue/5 p-5 rounded-2xl rounded-tl-none shadow-sm bg-brand-soft-orange/30">
                            <div className="flex gap-1.5">
                              <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div ref={chatEndRef} />
                </>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {notes.map((note) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={note.id} 
                      className="glass-panel p-6 border-brand-orange/10 bg-white border-l-4 border-l-brand-orange shadow-sm"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{note.content}</p>
                      <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Clock size={12} />
                        Consultant Feed • {new Date(note.created_at).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                  {notes.length === 0 && (
                    <div className="py-20 text-center">
                      <StickyNote size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 text-sm font-medium italic">No internal intelligence records exist for this project.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Overlay */}
            <div className="p-8 border-t border-brand-soft-orange bg-white/50 backdrop-blur-xl">
              {activeTab === 'chat' && (
                <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <AlertCircle size={12} className="text-slate-400" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                    Accuracy depends on Google Gemini AI. Please manually verify all technical outputs before implementation.
                  </p>
                </div>
              )}
              {activeTab === 'chat' ? (
                <form onSubmit={handleSendMessage} className="relative group">
                  <div className="absolute inset-x-0 -top-full h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Submit query to ${chatContext === 'report' ? 'Primary Document Set' : 'Discovery Intelligence'}...`}
                    className="w-full pl-6 pr-16 py-4 bg-white border border-brand-soft-orange rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 outline-none transition-all shadow-sm font-medium text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || chatLoading}
                    className="absolute right-2.5 top-2.5 btn-primary p-2.5 flex items-center justify-center shadow-lg shadow-brand-orange/20 disabled:grayscale disabled:opacity-30"
                  >
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddNote} className="flex gap-4">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log technical note or strategy observation..."
                    className="flex-1 px-6 py-4 bg-white border border-brand-soft-orange rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 outline-none transition-all shadow-sm font-medium text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="btn-primary px-8 py-3 text-xs uppercase tracking-widest font-bold"
                  >
                    Commit Entry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Intelligence Context Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          {modError && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-[11px] font-bold uppercase tracking-wider flex items-center gap-3 shadow-lg"
            >
              <AlertCircle size={16} />
              {modError}
            </motion.div>
          )}

          {/* Workflow Controls Card */}
          {(user?.role === 'admin' || user?.role === 'employee') && (
            <div className="premium-card p-6 border-slate-800/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-brand-cyan/10 text-brand-cyan rounded-lg">
                  <Settings size={14} />
                </div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Metadata</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Current Status</p>
                    <div className="relative group">
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateMetadata(e.target.value, report.visibility)}
                        className="input-field py-2 text-[11px] font-bold uppercase tracking-wider appearance-none bg-white border-brand-soft-orange"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s} className="bg-white font-bold">{s}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-orange">
                        <ArrowRight size={12} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Classification</p>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-brand-soft-orange">
                      {report.visibility === 'public' ? (
                        <div className="flex items-center gap-2">
                          <Eye size={14} className="text-brand-orange" />
                          <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider">Public</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <EyeOff size={14} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restricted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Enterprise Stakeholder</p>
                  <select
                    disabled={report.visibility === 'public'}
                    value={report.client_id || ''}
                    onChange={(e) => handleUpdateMetadata(report.status, report.visibility, Number(e.target.value))}
                    className={`input-field py-2.5 text-[11px] font-bold uppercase tracking-wider appearance-none bg-white border-brand-soft-orange ${
                      report.visibility === 'public' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-white">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Document Inventory Card */}
          <div className="glass-panel p-8 border-brand-soft-orange shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-slate-900">
              <Plus size={60} />
            </div>

            <div className="flex items-center justify-between mb-8 overflow-hidden">
              <h3 className="text-sm font-display font-bold text-slate-900 flex items-center gap-3">
                <FileText size={18} className="text-brand-orange" />
                Evidence Corpus
              </h3>
              {(user?.role === 'admin' || user?.role === 'employee') && (
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => handleAddFile(e, false)}
                />
              )}
            </div>

            <div className="space-y-8">
              {/* Primary Deliverables */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Primary Reports</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'employee') && (
                    <button 
                      onClick={() => report.visibility === 'public' ? setModError('Switch classification to Privilege for workspace edits') : fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-brand-orange border border-brand-soft-orange transition-all shadow-sm"
                    >
                      {fileUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {report.files?.filter((f: any) => !f.is_rough_note).map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 p-3 bg-brand-soft-orange/10 rounded-xl border border-brand-soft-orange group hover:border-brand-orange/30 transition-all">
                      <span className="text-[11px] font-bold text-slate-700 truncate tracking-tight flex-1">{file.original_name}</span>
                      <div className="flex items-center gap-1.5">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-brand-orange transition-colors">
                          <Download size={14} />
                        </a>
                        {(user?.role === 'admin' || user?.role === 'employee') && (
                          <div className="relative">
                            <button 
                              onClick={() => {
                                if (report.visibility === 'public') {
                                  setModError('Switch classification to Privilege for workspace edits');
                                } else {
                                  setDeletingFileId(file.id);
                                  setIsConfirmingDeleteFile(true);
                                }
                              }}
                              className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Purge Attachment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Research Intelligence */}
              {user?.role !== 'client' && (
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Internal Intelligence</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'employee') && (
                      <button 
                        onClick={() => {
                          roughFileInputRef.current?.click();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all shadow-lg"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                    <input type="file" ref={roughFileInputRef} className="hidden" onChange={(e) => handleAddFile(e, true)} />
                  </div>
                  <div className="space-y-2">
                    {report.files?.filter((f: any) => f.is_rough_note).map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 group hover:border-slate-700 transition-all">
                        <span className="text-[11px] font-bold text-slate-500 truncate tracking-tight flex-1">{file.original_name}</span>
                        <div className="flex items-center gap-1.5">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-600 hover:text-brand-cyan transition-colors">
                            <Download size={14} />
                          </a>
                          <button 
                            onClick={() => {
                              setDeletingFileId(file.id);
                              setIsConfirmingDeleteFile(true);
                            }}
                            className="p-1.5 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Purge Intellectual Asset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Intelligence Badge */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700 text-indigo-400">
              <Bot size={100} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-indigo-500 text-slate-950 rounded-lg shadow-lg shadow-indigo-500/20">
                  <Bot size={16} />
                </div>
                <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Contextual Engine</h3>
              </div>
              <p className="text-[11px] text-indigo-100/60 leading-relaxed font-medium">
                Analysis powered by <span className="text-indigo-300 font-bold">Project Gemini Technical Model</span>. The engine is trained to isolate technical risk factors and patent claim alignments across the current evidence set.
              </p>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmingClearChat}
        title="Clear Analytical History?"
        message={`Are you sure you want to permanently purge the ${chatContext === 'report' ? 'Report Analysis' : 'Rough Notes'} discourse? This operation cannot be reversed.`}
        onConfirm={handleClearHistory}
        onCancel={() => setIsConfirmingClearChat(false)}
        confirmLabel="Purge History"
      />

      <ConfirmationModal
        isOpen={isConfirmingDeleteFile}
        title="Purge System Attachment?"
        message="Are you sure you want to permanently delete this jurisdictional document? This will remove it from the analytical context."
        onConfirm={handleDeleteFile}
        onCancel={() => {
          setIsConfirmingDeleteFile(false);
          setDeletingFileId(null);
        }}
        confirmLabel="Deauthorize File"
      />

      <AnimatePresence>
        {showIdentity && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIdentity(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-soft-orange"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Analysis Identity</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cross-Reference Jurisdictional Metadata</p>
                  </div>
                  <button 
                    onClick={() => setShowIdentity(false)}
                    className="p-2 text-slate-400 hover:text-brand-orange transition-colors"
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-brand-soft-orange/5 p-4 rounded-2xl border border-brand-soft-orange/30">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">LogicApt Code</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{report.logicapt_project_code || 'N/A'}</p>
                  </div>
                  <div className="bg-brand-soft-orange/5 p-4 rounded-2xl border border-brand-soft-orange/30">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client Code</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{report.client_project_code || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-brand-soft-orange/20">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Type</span>
                    <span className="text-xs font-bold text-slate-900">{report.project_type || 'Unspecified'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-brand-soft-orange/20">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patent Number</span>
                    <span className="text-xs font-bold text-slate-900">{report.patent_no || 'N/A'}</span>
                  </div>
                  <div className="py-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Patent Title</span>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                      {report.patent_title || 'No title associated with this record.'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-soft-orange/20">
                  <button 
                    onClick={() => setShowIdentity(false)}
                    className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all font-display"
                  >
                    Dismiss Intelligence Summary
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
