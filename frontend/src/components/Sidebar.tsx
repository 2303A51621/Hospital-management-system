import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'patient'],
    },
    {
      path: '/patients',
      label: 'Patients',
      icon: Users,
      roles: ['admin', 'doctor'],
    },
    {
      path: '/doctors',
      label: 'Doctors',
      icon: Stethoscope,
      roles: ['patient', 'doctor'],
    },
    {
      path: '/appointments',
      label: 'Book Appointment',
      icon: Calendar,
      roles: ['doctor', 'patient'],
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
      roles: ['patient', 'doctor', 'admin'],
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
      roles: ['admin', 'doctor', 'patient'],
    },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="relative z-20 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-sky-100 bg-slate-900 text-white">
      <div className="flex min-h-full flex-col">
      <div className="p-4">
        <KushalLogo size="sm" showText={false} />
        <p className="text-xs uppercase tracking-wider text-slate-400 mt-2">Hospital Console</p>
      </div>

      <nav className="space-y-2 px-4">
        {visibleItems.map((item) => {
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
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400">© 2026 Kushal Hospitals</p>
      </div>
      </div>
    </aside>
  );
}
