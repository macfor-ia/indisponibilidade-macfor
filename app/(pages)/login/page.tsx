'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { API } from '../../lib/api-client';
import { useAuth } from '../../providers';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/unavailability');
  }, [user, loading, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await API.login(email, password);
      await refresh();
      router.push('/unavailability');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Indisponibilidade</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Acesse sua conta Macfor</p>
        </div>

        <form onSubmit={submit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Email</label>
            <InputText
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full"
              placeholder="seu@email.com"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Senha</label>
            <InputText
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Button type="submit" label="Entrar" loading={submitting} className="w-full justify-center" />
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          Não tem conta?{' '}
          <button className="text-[var(--accent)] hover:underline" onClick={() => router.push('/register')}>
            Solicitar acesso
          </button>
        </p>
      </div>
    </div>
  );
}
