'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { BRAND } from '@/constants/brand';

const AUTH_ERROR_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(AUTH_ERROR_MESSAGE);
        return;
      }
      router.push('/admin');
    } catch {
      setError(AUTH_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface-secondary px-5">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-border-solid p-8 shadow-sm">
        <h1 className="text-xl font-bold text-text mb-6 text-center tracking-tight">
          {BRAND.adminLogin}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[11px] font-semibold text-text-sub mb-1"
            >
              이메일
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] outline-none focus:border-primary"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-semibold text-text-sub mb-1"
            >
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] outline-none focus:border-primary"
            />
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-[10px] font-semibold bg-primary text-white hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                로그인
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
