import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import KushalLogo from './KushalLogo';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  User,
  Siren,
  ShieldCheck,
  Building2,
  BarChart3,
  CreditCard,
  Pill,
  Settings,
  BedDouble,
  FileHeart,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  History,
  Share2,
  MessageSquare,
  CalendarDays,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, closeSidebar, openSidebar } = useUIStore();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Section 13: Exact Doctor Portal Sidebar Menu Items
  const doctorMenuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/patients', label: 'My Patients', icon: Users },
    { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { path: '/doctor/consultations', label: 'Consultations', icon: Stethoscope },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
    { path: '/doctor/reports', label: 'Medical Reports', icon: FlaskConical },
    { path: '/doctor/patient-history', label: 'Patient Medical History', icon: History },
    { path: '/doctor/referrals', label: 'Referrals', icon: Share2 },
    { path: '/doctor/messages', label: 'Messages', icon: MessageSquare },
    { path: '/doctor/availability', label: 'Availability & Leave', icon: CalendarDays },
    { path: '/doctor/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { path: '/doctor/profile', label: 'My Profile', icon: User },
    { path: '/doctor/settings', label: 'Settings', icon: Settings },
  ];

  // Standard non-doctor menu items
  const standardMenuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'patient'],
    },
    {
      path: '/patients',
      label: 'Patients',
      icon: Users,
      roles: ['admin'],
    },
    {
      path: '/doctors',
      label: 'Doctors',
      icon: Stethoscope,
      roles: ['patient'],
    },
    {
      path: '/appointments',
      label: 'Book Appointment',
      icon: Calendar,
      roles: ['patient'],
    },
    {
      path: '/emergency-admin',
      label: 'Emergency Admin',
      icon: Siren,
      roles: ['admin', 'receptionist'],
    },
    {
      path: '/departments',
      label: 'Departments',
      icon: Building2,
      roles: ['admin'],
    },
    {
      path: '/analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      path: '/billing',
      label: 'Billing & Insurance',
      icon: CreditCard,
      roles: ['admin'],
    },
    {
      path: '/staff',
      label: 'Staff',
      icon: Users,
      roles: ['admin'],
    },
    {
      path: '/wards',
      label: 'Bed & Wards',
      icon: BedDouble,
      roles: ['admin'],
    },
    {
      path: '/medical-records',
      label: 'Medical Records',
      icon: FileHeart,
      roles: ['patient', 'admin'],
    },
    {
      path: '/pharmacy',
      label: 'Pharmacy Management',
      icon: Pill,
      roles: ['admin'],
    },
    {
      path: '/emergency-admission',
      label: 'Emergency & Admission',
      icon: Siren,
      roles: ['admin'],
    },
    {
      path: '/payment',
      label: 'Payment',
      icon: CreditCard,
      roles: ['admin'],
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      roles: ['admin'],
    },
    {
      path: '/admin-management',
      label: 'Admin Panel',
      icon: ShieldCheck,
      roles: ['admin', 'super_admin'],
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      roles: ['admin', 'patient'],
    },
  ];

  const isDoctor = user?.role === 'doctor';
  const visibleStandardItems = standardMenuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={openSidebar}
          title="Open navigation"
          aria-label="Open navigation"
          className="fixed top-20 left-0 z-30 flex items-center gap-1.5 rounded-r-xl bg-slate-900 text-white px-2.5 py-2 shadow-lg border-y border-r border-slate-700 hover:bg-teal-700 transition group backdrop-blur"
        >
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform text-teal-300" />
          <span className="text-xs font-semibold pr-1">Menu</span>
        </button>
      )}

      <aside
        className={`relative z-20 flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'
        }`}
      >
        <div className="flex min-h-full w-64 flex-col overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div>
              <KushalLogo size="sm" showText={false} />
              <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">
                {isDoctor ? 'Doctor Portal' : 'Hospital Console'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              title="Close navigation"
              aria-label="Close navigation"
              className="flex items-center gap-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3 py-3 flex-1 overflow-y-auto">
            {isDoctor ? (
              <>
                {doctorMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                        isActive(item.path)
                          ? 'bg-teal-700 text-white shadow'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}

                {/* 14. Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-left mt-2"
                >
                  <LogOut size={17} className="shrink-0" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              visibleStandardItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.path}-${item.label}`}
                    to={item.path}
                    className={`flex items-center space-x-3 rounded-xl px-4 py-2.5 transition ${
                      isActive(item.path)
                        ? 'bg-teal-700 text-white shadow'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            )}
          </nav>

          <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>© 2026 Kushal Hospitals</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-teal-400 font-mono">v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
}
