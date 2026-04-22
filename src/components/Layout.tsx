import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LogoutOverlay from './LogoutOverlay';
import { AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserPlus, 
  LogOut, 
  MessageSquare,
  ExternalLink,
  Settings,
  ShieldAlert,
  Globe
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, config } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const { BRAND_CONFIG, ENTERPRISE_LINKS, INSTITUTIONAL_CONTACTS } = config;

  const handleLogout = () => {
    setShowLogoutOverlay(true);
    // Wait for 4 seconds as requested
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 4000);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'employee', 'client'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['admin', 'employee', 'client'] },
    { name: 'Users', path: '/admin/users', icon: UserPlus, roles: ['admin'] },
    { name: 'Clients', path: '/admin/clients', icon: Users, roles: ['admin'] },
    { name: 'Chat Settings', path: '/admin/chat-settings', icon: Settings, roles: ['admin'] },
    { name: 'System Settings', path: '/admin/system-settings', icon: Globe, roles: ['admin'] },
    { name: 'Infrastructure Status', path: '/admin/alerts', icon: ShieldAlert, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-brand-light-orange font-sans text-slate-900">
      <AnimatePresence>
        {showLogoutOverlay && (
          <LogoutOverlay username={user?.username || 'Valued User'} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-68 bg-white border-r border-brand-soft-orange flex flex-col shadow-xl z-20">
        <div className="p-8 flex justify-center">
          <Link to="/" className="group flex flex-col items-center gap-4">
            <img 
              src={BRAND_CONFIG.LOGO_URL} 
              alt={`${BRAND_CONFIG.NAME} Logo`}
              className="h-14 w-auto group-hover:scale-110 transition-transform" 
              referrerPolicy="no-referrer"
            />
            <div className="text-center">
              <p className="text-[10px] text-brand-orange font-bold uppercase tracking-[0.3em]">
                Analytics Portal
              </p>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto pt-4 scrollbar-hide">
          <div className="space-y-1">
            <div className="px-4 mb-2">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Portal Navigation</p>
            </div>
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <div className="px-4 mb-2 flex items-center justify-between">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">External Resources</p>
              <ExternalLink size={10} className="text-slate-400" />
            </div>
            <a href={ENTERPRISE_LINKS.SEARCH_SERVICES} target="_blank" rel="noopener noreferrer" className="nav-link nav-link-inactive">
              <FileText size={18} />
              IP Search Services
            </a>
            <a href={ENTERPRISE_LINKS.INSIGHTS} target="_blank" rel="noopener noreferrer" className="nav-link nav-link-inactive">
              <MessageSquare size={18} />
              Industry Insights
            </a>
          </div>
        </nav>

        <div className="p-6 border-t border-brand-soft-orange bg-brand-soft-orange/20">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-white border border-brand-soft-orange">
            <div className="w-9 h-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm shadow-inner">
              {user?.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(234,107,20,0.05),transparent_40%)] flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto p-8 lg:p-12 w-full">
          {children}
        </div>

        {/* Brand Footer */}
        <footer className="mt-auto border-t border-brand-soft-orange bg-white/50 backdrop-blur-md px-8 py-12 lg:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={BRAND_CONFIG.LOGO_URL} 
                  alt={`${BRAND_CONFIG.NAME} Logo`} 
                  className="h-10 w-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                World leader in prior art searching and comprehensive IP solutions ranging from patent searches to portfolio analysis.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Search Services</h4>
              <ul className="space-y-2">
                {[
                  { name: 'Patentability Search', url: ENTERPRISE_LINKS.SEARCH_SERVICES },
                  { name: 'Invalidity Search', url: ENTERPRISE_LINKS.SEARCH_SERVICES },
                  { name: 'Freedom to Operate', url: ENTERPRISE_LINKS.SEARCH_SERVICES },
                  { name: 'Landscape Analysis', url: ENTERPRISE_LINKS.SEARCH_SERVICES }
                ].map(item => (
                  <li key={item.name}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-brand-orange transition-colors">{item.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { name: 'About Us', url: ENTERPRISE_LINKS.ABOUT },
                  { name: 'Leadership', url: ENTERPRISE_LINKS.LEADERSHIP },
                  { name: 'Our Advisors', url: ENTERPRISE_LINKS.ADVISORS },
                  { name: 'Blogs', url: ENTERPRISE_LINKS.INSIGHTS }
                ].map(item => (
                  <li key={item.name}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-brand-orange transition-colors">{item.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Contact Information</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Queries support regarding the analytics portal? 
                Reach out to our technical team.
              </p>
              <a href={`mailto:${INSTITUTIONAL_CONTACTS.PRIMARY_EMAIL}`} className="text-sm font-bold text-brand-orange hover:underline block pt-2">{INSTITUTIONAL_CONTACTS.PRIMARY_EMAIL}</a>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-brand-soft-orange flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} {BRAND_CONFIG.FULL_NAME}. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-6">
              <a href={ENTERPRISE_LINKS.PRIVACY} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-brand-orange transition-colors uppercase font-bold tracking-wider">Privacy Policy</a>
              <a href={ENTERPRISE_LINKS.TERMS} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-brand-orange transition-colors uppercase font-bold tracking-wider">Terms of Service</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
