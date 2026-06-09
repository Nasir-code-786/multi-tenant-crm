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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-4">
      <div className="card w-full max-w-md p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="w-8 h-8 text-[#6366F1]" />
          <h1 className="text-2xl font-bold">CRM Pro</h1>
        </div>
        <p className="text-center text-[#94A3B8] text-sm mb-8">
          Sign in to your account
        </p>

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

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#334155]">
          <p className="text-xs text-[#94A3B8] mb-2 font-medium">Test accounts:</p>
          <ul className="text-xs text-[#94A3B8] space-y-1">
            <li>alice@techcorp.com (admin)</li>
            <li>bob@techcorp.com (member)</li>
            <li>dave@startupxyz.com (admin)</li>
            <li className="text-[#64748B]">password: password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
