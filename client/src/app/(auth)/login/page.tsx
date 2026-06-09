'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alice@techcorp.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.login(email, password);
      router.push('/customers');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mb-6">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Multi-Tenant CRM</h1>
          <p className="text-neutral-400 text-lg max-w-md leading-relaxed">
            Manage customers, notes, and assignments across your organization — all in one place.
          </p>
          <div className="mt-10 h-1 w-16 bg-orange-500 rounded-full" />
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-950">Multi-Tenant CRM</span>
          </div>

          <h2 className="text-2xl font-bold text-neutral-950 mb-1">Welcome back</h2>
          <p className="text-neutral-500 text-sm mb-8">Sign in to your account</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 mb-2 font-medium">Test accounts:</p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>alice@techcorp.com (admin)</li>
              <li>bob@techcorp.com (member)</li>
              <li>dave@startupxyz.com (admin)</li>
              <li className="text-neutral-400">password: password123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
