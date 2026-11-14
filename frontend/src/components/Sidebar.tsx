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
  PhoneCall,
  CalendarPlus,
  Clock,
  Video,
  Star,
  Sparkles,
  Activity,
  ClipboardList,
  FileText,
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
    {
      group: 'CLINICAL PRACTICE',
      items: [
        { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/doctor/patients', label: 'My Patients', icon: Users },
        { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
        { path: '/doctor/consultations', label: 'Consultations', icon: Stethoscope },
        { path: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
        { path: '/doctor/reports', label: 'Medical Reports', icon: FlaskConical },
        { path: '/doctor/patient-history', label: 'Patient Medical History', icon: History },
        { path: '/doctor/referrals', label: 'Referrals', icon: Share2 },
      ],
    },
    {
      group: 'COMMUNICATIONS & OPS',
      items: [
        { path: '/doctor/messages', label: 'Messages', icon: MessageSquare },
        { path: '/doctor/availability', label: 'Availability & Leave', icon: CalendarDays },
        { path: '/doctor/analytics', label: 'Analytics & Reports', icon: BarChart3 },
      ],
    },
    {
      group: 'ACCOUNT & SECURITY',
      items: [
        { path: '/doctor/profile', label: 'My Profile', icon: User },
        { path: '/doctor/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // Section 20: Exact 18 Patient Portal Sidebar Menu Items
  const patientMenuItems = [
    {
      group: 'CLINICAL CARE',
      items: [
        { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/patient/doctors', label: 'Find Doctors', icon: Stethoscope },
        { path: '/patient/book-appointment', label: 'Book Appointment', icon: CalendarPlus },
        { path: '/patient/appointments', label: 'My Appointments', icon: Calendar },
        { path: '/patient/telemedicine', label: 'Online Consultation', icon: Video },
        { path: '/patient/follow-ups', label: 'Follow-ups', icon: Clock },
      ],
    },
    {
      group: 'HEALTH RECORDS',
      items: [
        { path: '/patient/records', label: 'Medical Records', icon: FileHeart },
        { path: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
        { path: '/patient/reports', label: 'Medical Reports', icon: FlaskConical },
        { path: '/patient/health-overview', label: 'Health Overview', icon: BarChart3 },
      ],
    },
    {
      group: 'FINANCIAL & FAMILY',
      items: [
        { path: '/patient/payments', label: 'Payments & Invoices', icon: CreditCard },
        { path: '/patient/family', label: 'Family Members', icon: Users },
        { path: '/patient/messages', label: 'Messages', icon: MessageSquare },
      ],
    },
    {
      group: 'SUPPORT & ACCOUNT',
      items: [
        { path: '/patient/feedback', label: 'Feedback & Reviews', icon: Star },
        { path: '/patient/health-tips', label: 'Health Tips', icon: Sparkles },
        { path: '/patient/emergency', label: 'Emergency Support', icon: PhoneCall },
        { path: '/patient/profile', label: 'My Profile', icon: User },
        { path: '/patient/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // Nurse Role Module Sidebar Menu Items
  const nurseMenuItems = [
    {
      group: 'PATIENT CARE',
      items: [
        { path: '/nurse/dashboard', label: 'Nurse Dashboard', icon: LayoutDashboard },
        { path: '/nurse/patients', label: 'Assigned Patients', icon: Users },
        { path: '/nurse/vitals', label: 'Vital Signs Monitor', icon: Activity },
        { path: '/nurse/medications', label: 'Medication (eMAR)', icon: Pill },
        { path: '/nurse/tasks', label: 'Nursing Tasks', icon: ClipboardList },
        { path: '/nurse/notes', label: 'Clinical Notes', icon: FileText },
      ],
    },
    {
      group: 'WARD & SCHEDULE',
      items: [
        { path: '/nurse/schedule', label: 'Care Schedule', icon: CalendarDays },
        { path: '/nurse/wards', label: 'Wards & Beds', icon: BedDouble },
        { path: '/nurse/doctor-communication', label: 'Doctor Comms', icon: MessageSquare },
        { path: '/nurse/emergency', label: 'Emergency Alerts', icon: Siren },
      ],
    },
    {
      group: 'SHIFT & ACCOUNT',
      items: [
        { path: '/nurse/shifts', label: 'Shifts & Handover', icon: Clock },
        { path: '/nurse/reports', label: 'Nursing Reports', icon: BarChart3 },
        { path: '/nurse/profile', label: 'My Profile', icon: User },
      ],
    },
  ];

  // Standard non-doctor menu items with groups
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
      path: '/medical-records',
      label: 'Medical Records',
      icon: FileHeart,
      roles: ['patient', 'admin'],
    },
    {
      path: '/departments',
      label: 'Departments',
      icon: Building2,
      roles: ['admin'],
    },
    {
      path: '/wards',
      label: 'Bed & Wards',
      icon: BedDouble,
      roles: ['admin'],
    },
    {
      path: '/pharmacy',
      label: 'Pharmacy Management',
      icon: Pill,
      roles: ['admin'],
    },
    {
      path: '/emergency-admin',
      label: 'Emergency Admin',
      icon: Siren,
      roles: ['admin', 'receptionist'],
    },
    {
      path: '/emergency-admission',
      label: 'Emergency & Admission',
      icon: Siren,
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
      label: 'Staff Directory',
      icon: Users,
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
  const isPatient = user?.role === 'patient';
  const isNurse = user?.role === 'nurse';
  const visibleStandardItems = standardMenuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Floating Reopen Pill when closed */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={openSidebar}
          title="Open navigation"
          aria-label="Open navigation"
          className="fixed top-20 left-0 z-40 flex items-center gap-1.5 rounded-r-2xl bg-gradient-to-r from-[#0b1e36] to-[#0d2a4c] text-white px-3 py-2.5 shadow-2xl border-y border-r border-teal-500/40 hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 group backdrop-blur"
        >
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform text-teal-300" />
          <span className="text-xs font-bold tracking-wide pr-1">Menu</span>
        </button>
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`relative z-30 flex h-screen shrink-0 flex-col border-r border-[#152e4d] bg-[#0b1e36] text-white transition-all duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'
        }`}
      >
        <div className="flex min-h-full w-64 flex-col overflow-y-auto">
          {/* Top Brand Banner */}
          <div className="p-4 border-b border-[#173860] bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="flex items-center justify-between">
              <KushalLogo size="sm" showText={true} lightText={true} />
              <button
                type="button"
                onClick={closeSidebar}
                title="Close navigation"
                aria-label="Close navigation"
                className="flex items-center rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-900/40 border border-teal-700/50 px-2 py-0.5 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isDoctor ? 'Doctor Portal' : isPatient ? 'Patient Portal' : 'Hospital Console'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">NABH A+</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="flex-1 space-y-4 px-3 py-3 overflow-y-auto">
            {isDoctor ? (
              <>
                {doctorMenuItems.map((section) => (
                  <div key={section.group} className="space-y-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90">
                      {section.group}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 group ${
                            active
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 ring-1 ring-teal-300/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon
                            size={17}
                            className={`shrink-0 transition-transform group-hover:scale-110 ${
                              active ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {/* Logout Button */}
                <div className="pt-2 border-t border-[#173860]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition text-left"
                  >
                    <LogOut size={17} className="shrink-0 text-rose-400" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : isPatient ? (
              <>
                {patientMenuItems.map((section) => (
                  <div key={section.group} className="space-y-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90">
                      {section.group}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 group ${
                            active
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 ring-1 ring-teal-300/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon
                            size={17}
                            className={`shrink-0 transition-transform group-hover:scale-110 ${
                              active ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {/* Patient Logout Button */}
                <div className="pt-2 border-t border-[#173860]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition text-left"
                  >
                    <LogOut size={17} className="shrink-0 text-rose-400" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : isNurse ? (
              <>
                {nurseMenuItems.map((section) => (
                  <div key={section.group} className="space-y-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90">
                      {section.group}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 group ${
                            active
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 ring-1 ring-teal-300/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon
                            size={17}
                            className={`shrink-0 transition-transform group-hover:scale-110 ${
                              active ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {/* Nurse Logout Button */}
                <div className="pt-2 border-t border-[#173860]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition text-left"
                  >
                    <LogOut size={17} className="shrink-0 text-rose-400" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90">
                  NAVIGATION
                </div>
                {visibleStandardItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={`${item.path}-${item.label}`}
                      to={item.path}
                      className={`flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 group ${
                        active
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 ring-1 ring-teal-300/30'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 transition-transform group-hover:scale-110 ${
                          active ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Bottom Hospital Contact & Version */}
          <div className="p-3 border-t border-[#173860] bg-black/20 space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-teal-950/60 border border-teal-800/40 p-2 text-[11px] text-teal-200">
              <PhoneCall size={14} className="text-teal-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white">24/7 Helpline</div>
                <div className="text-[10px] text-teal-300/90 font-mono">+91 1800-KUSHAL</div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>© 2026 Kushal Hospitals</span>
              <span className="font-mono text-teal-400 font-bold">v2.4 Pro</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
