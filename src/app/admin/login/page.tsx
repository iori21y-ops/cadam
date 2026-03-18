'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';

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
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E5E5EA] p-8 shadow-sm">
        <h1 className="text-xl font-bold text-[#1D1D1F] mb-6 text-center tracking-tight">
          카담 관리자 로그인
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[11px] font-semibold text-[#86868B] mb-1"
            >
              이메일
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] outline-none focus:border-[#007AFF]"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-semibold text-[#86868B] mb-1"
            >
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] outline-none focus:border-[#007AFF]"
            />
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-[10px] font-semibold bg-[#007AFF] text-white hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
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
