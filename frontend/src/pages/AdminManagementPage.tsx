import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, UserPlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { authAPI } from '../services/api';

export default function AdminManagementPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authAPI.createAdmin(form);
      toast.success('Admin account created');
      setForm({ name: '', email: '', phone: '', password: '' });
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Unable to create admin account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#edf6ff]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <section className="mx-auto max-w-4xl rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-xl bg-cyan-100 p-3 text-cyan-700"><ShieldCheck size={24} /></span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Admin Panel</p>
                <h1 className="text-3xl font-bold text-slate-900">Create administrator</h1>
              </div>
            </div>
            <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Only an existing administrator can create this account. Patient accounts and patient data are unchanged.
            </p>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              {[
                ['name', 'Full name', 'text'],
                ['email', 'Email', 'email'],
                ['phone', 'Phone', 'tel'],
                ['password', 'Temporary password', 'password'],
              ].map(([field, label, type]) => (
                <label key={field} className="text-sm font-medium text-slate-700">
                  {label}
                  <input
                    required={field !== 'phone'}
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(event) => update(field as keyof typeof form, event.target.value)}
                    minLength={field === 'password' ? 8 : undefined}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              ))}
              <button type="submit" disabled={loading} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 font-semibold text-white hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60">
                <UserPlus size={17} /> {loading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
