import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LogOut,
  Menu,
  PanelLeftClose,
  User,
  PhoneCall,
} from 'lucide-react';
import KushalLogo from './KushalLogo';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const roleName = user?.role?.replace('_', ' ') || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/70';
      case 'admin':
      case 'super_admin':
        return 'bg-purple-50 text-purple-800 border-purple-200/70';
      case 'nurse':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200/70';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200/70';
    }
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Sidebar Toggle & Branding */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 focus:outline-none"
            >
              {isSidebarOpen ? <PanelLeftClose size={19} /> : <Menu size={19} />}
            </button>

            <KushalLogo size="md" showText={true} />

            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Hospital System Active
              </span>
            </div>
          </div>

          {/* Right: Emergency Line, User Chip & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Emergency contact chip */}
            <a
              href="tel:1800587425"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition shadow-xs"
              title="Call 24/7 Emergency Casualty"
            >
              <PhoneCall size={13} className="text-red-600 animate-bounce" />
              <span>Emergency 24x7</span>
            </a>

            {/* User Profile Chip */}
            <div
              onClick={() => navigate(user?.role === 'doctor' ? '/doctor/profile' : '/profile')}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition group"
            >
              {/* Avatar Initials with pulse dot */}
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="text-left hidden sm:block">
                <p className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition">
                  {displayName}
                </p>
                <span
                  className={`inline-block text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                    user?.role
                  )}`}
                >
                  {roleName}
                </span>
              </div>
            </div>

            {/* Profile Action button */}
            <button
              onClick={() => navigate(user?.role === 'doctor' ? '/doctor/profile' : '/profile')}
              className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <User size={15} />
              <span>Profile</span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-xs"
              title="Log out from console"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
